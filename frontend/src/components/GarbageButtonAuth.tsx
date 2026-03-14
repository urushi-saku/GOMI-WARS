import { useState, useRef, useCallback } from "react";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { assessGarbage, fileToBase64 } from "../utils/assessApi";
import type { AssessResponse } from "../utils/assessApi";

/**
 * モーダルの表示ステップ
 * - select      : カメラorフォルダ選択
 * - camera_view : WebRTCによるカメラプレビュー＆撮影
 * - preview     : 撮影・選択した画像のプレビュー＋査定ボタン
 * - result      : Gemini による査定結果の表示
 */
type ModalStep = "select" | "camera_view" | "preview" | "result";

export default function GarbageButtonAuth({ className }: { className?: string }) {
  // ログイン済みユーザー向けのゴミ投稿ボタン＋モーダル

  // モーダルの開閉状態
  const [isOpen, setIsOpen] = useState(false);
  // 現在のモーダルステップ
  const [step, setStep] = useState<ModalStep>("select");
  // カメラで撮影した File オブジェクト
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // プレビュー表示用の Object URL（使用後は revokeObjectURL で解放する）
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // previewUrl の revoke 用 ref（コールバックの依存配列から除外するため）
  const previewUrlRef = useRef<string | null>(null);
  // Render API 呼び出し中フラグ（二重送信防止にも使用）
  const [isLoading, setIsLoading] = useState(false);
  // Gemini 査定結果（aiResult + totalPoint をまとめて管理）
  const [assessment, setAssessment] = useState<AssessResponse | null>(null);
  // エラーメッセージ（API エラー・バリデーションエラー）
  const [error, setError] = useState<string | null>(null);

  // モーダル DOM への参照（フォーカス管理に使用）
  const dialogRef = useRef<HTMLDivElement>(null);
  // 起動ボタンへの参照（モーダルを閉じた後にフォーカスを戻すために使用）
  const triggerRef = useRef<HTMLButtonElement>(null);
  // カメラ・アップロード input への参照
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // WebRTC用参照
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * カメラストリームを停止するユーティリティ
   */
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  /**
   * モーダルを閉じてすべての状態をリセットする
   * Object URL のメモリリークを防ぐため revokeObjectURL も実行する
   */
  const handleClose = useCallback(() => {
    stopCameraStream();
    setIsOpen(false);
    setStep("select");
    setSelectedFile(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setAssessment(null);
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * WebRTCを利用してカメラを起動する
   */
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // 背面カメラを優先
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep("camera_view");
    } catch (err) {
      console.error("Camera error:", err);
      setError("カメラの起動に失敗しました。権限が許可されているか確認してください。");
    }
  }, []);

  /**
   * video要素の現在のフレームをキャプチャしてFileオブジェクト化する
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // videoの元のサイズに合わせてcanvasのサイズを設定
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("写真のキャプチャに失敗しました。");
        return;
      }
      const file = new File([blob], "captured_garbage.jpg", { type: "image/jpeg" });
      
      stopCameraStream(); // 撮影後はカメラを停止する

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setStep("preview");
    }, "image/jpeg", 0.9);
  }, [previewUrl, stopCameraStream]);

  /**
   * ファイル・フォルダから画像を選択した場合の処理
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // MIME タイプで画像以外を弾く（念のためのクライアントサイド検証）
      if (!file.type.startsWith("image/")) {
        setError("画像ファイルを選択してください");
        return;
      }

      // 前回の Object URL を解放してから新しい URL を生成する
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setSelectedFile(file);
      setPreviewUrl(url);
      setError(null);
      setStep("preview");
    },
    []
  );

  /**
   * 撮影した画像を Render の /api/assess エンドポイントに送信して査定を受ける
   * 1. Geolocation API と画像エンコードを並列で実行
   * 2. Firebase ID トークンを付与して API へ POST
   * 3. レスポンスを assessment ステートに格納して結果ステップへ
   */
  const handleAssess = useCallback(async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // 位置情報取得と画像エンコードを並列実行
      const getLocation = navigator.geolocation
        ? new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              // 拒否・タイムアウトは undefined で resolve してスキップ
              () => resolve(undefined),
              { timeout: 5000 }
            );
          })
        : Promise.resolve(undefined);

      const [location, encoded] = await Promise.all([
        getLocation,
        fileToBase64(selectedFile),
      ]);

      const response = await assessGarbage({ ...encoded, location });
      setAssessment(response);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "査定に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  /**
   * 撮影をやり直す
   * プレビューと結果をクリアして select ステップへ戻る
   */
  const handleRetry = useCallback(() => {
    stopCameraStream();
    setStep("select");
    setSelectedFile(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setAssessment(null);
    setError(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  }, [stopCameraStream]);

  // フォーカス管理: 初期フォーカス・Tabトラップ・Escapeで閉じる
  // handleClose を直接渡すことで毎レンダリングの effect 再実行（stale closure）を防ぐ
  useDialogFocusTrap(isOpen, dialogRef, triggerRef, handleClose);

  return (
    <>
      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="garbage-modal-title"
        >
          <button
            type="button"
            aria-label="モーダルを閉じる"
            onClick={handleClose}
          >
            ×
          </button>

          {/* ── ステップ 1: カメラ撮影 / 写真投稿 ── */}
          {step === "select" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              padding: "15px",
              background: "rgba(0, 15, 30, 0.8)",
              border: "1px solid var(--cy-cyan, #00f3ff)",
              borderRadius: "4px",
              marginBottom: "15px"
            }}>
              <h3 id="garbage-modal-title" style={{ margin: "0 0 5px", fontSize: "1rem", color: "#fff", textAlign: "center", letterSpacing: "2px" }}>
                投稿方法を選択
              </h3>
              {error && <p role="alert" style={{ color: "var(--cy-magenta, #ff00ea)", fontSize: "0.9rem" }}>{error}</p>}
              
              <button
                type="button"
                onClick={startCamera}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px",
                  background: "rgba(0, 243, 255, 0.1)",
                  border: "1px solid var(--cy-cyan, #00f3ff)",
                  color: "var(--cy-cyan, #00f3ff)",
                  textAlign: "center",
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "2px",
                  transition: "all 0.2s"
                }}
              >
                [ 📷 カメラを起動 ]
              </button>

              <label style={{
                display: "block",
                padding: "12px",
                background: "rgba(255, 0, 234, 0.05)",
                border: "1px solid var(--cy-magenta, #ff00ea)",
                color: "var(--cy-magenta, #ff00ea)",
                textAlign: "center",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                letterSpacing: "2px",
                transition: "all 0.2s"
              }}>
                [ 📁 写真を投稿 ]
                <input
                  ref={uploadInputRef}
                  type="file"
                  id="garbage-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          )}

          {/* ── ステップ 1.5: ライブカメラビュー ── */}
          {step === "camera_view" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "15px",
              background: "rgba(0, 15, 30, 0.9)",
              border: "1px solid var(--cy-cyan, #00f3ff)",
              marginBottom: "15px"
            }}>
              <h3 id="garbage-modal-title" style={{ margin: 0, color: "#fff", textAlign: "center", letterSpacing: "2px" }}>
                🎯 フレームに合わせて撮影
              </h3>
              
              <div style={{ position: "relative", width: "100%", background: "#000" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: "100%", maxHeight: "50vh", objectFit: "cover", display: "block" }}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                
                {/* 中央のターゲティングUI装飾 */}
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "150px", height: "150px",
                  border: "2px solid rgba(0, 243, 255, 0.5)",
                  pointerEvents: "none"
                }}>
                  <div style={{ position: "absolute", top: "-2px", left: "-2px", width: "15px", height: "15px", borderTop: "2px solid #00f3ff", borderLeft: "2px solid #00f3ff" }}></div>
                  <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "15px", height: "15px", borderTop: "2px solid #00f3ff", borderRight: "2px solid #00f3ff" }}></div>
                  <div style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "15px", height: "15px", borderBottom: "2px solid #00f3ff", borderLeft: "2px solid #00f3ff" }}></div>
                  <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "15px", height: "15px", borderBottom: "2px solid #00f3ff", borderRight: "2px solid #00f3ff" }}></div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={handleRetry}
                  style={{
                    flex: 1, padding: "12px", background: "transparent",
                    color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.3)"
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  style={{
                    flex: 2, padding: "12px", background: "rgba(0, 243, 255, 0.2)",
                    color: "#00f3ff", border: "1px solid #00f3ff", fontWeight: "bold",
                    textShadow: "0 0 5px #00f3ff"
                  }}
                >
                  📸 撮影する
                </button>
              </div>
            </div>
          )}

          {/* ── ステップ 2: プレビュー & 査定 ── */}
          {step === "preview" && previewUrl && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "15px",
              background: "rgba(0, 15, 30, 0.8)",
              border: "1px solid var(--cy-cyan, #00f3ff)",
              marginBottom: "15px"
            }}>
              <h3 id="garbage-modal-title" style={{ margin: 0, color: "#fff", textAlign: "center" }}>プレビュー確認</h3>
              <img
                src={previewUrl}
                alt="選択した画像のプレビュー"
                style={{ maxWidth: "100%", maxHeight: "300px" }}
              />
              {error && <p role="alert">{error}</p>}
              <button type="button" onClick={handleRetry} disabled={isLoading}>
                撮り直す
              </button>
              <button
                type="button"
                onClick={handleAssess}
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? "査定中…" : "査定する"}
              </button>
            </div>
          )}

          {/* ── ステップ 3: 査定結果 ── */}
          {step === "result" && assessment && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "15px",
              background: "rgba(0, 15, 30, 0.8)",
              border: "1px solid var(--cy-magenta, #ff00ea)",
              marginBottom: "15px"
            }}>
              <h3 id="garbage-modal-title" style={{ margin: 0, color: assessment.aiResult.is_trash ? "#00f3ff" : "#ff00ea", textAlign: "center" }}>
                {assessment.aiResult.is_trash ? "査定結果" : "ゴミではありません"}
              </h3>
              {assessment.aiResult.is_trash ? (
                <>
                  <p>
                    <strong>{assessment.aiResult.type}</strong>（{assessment.aiResult.material}）
                  </p>
                  <p>獲得ポイント: <strong>{assessment.aiResult.points} pt</strong></p>
                  <p>累計ポイント: <strong>{assessment.totalPoint} pt</strong></p>
                  <p>{assessment.aiResult.comment}</p>
                  {assessment.aiResult.is_suspicious && (
                    <p role="alert">⚠️ 不審な画像と判定されました</p>
                  )}
                </>
              ) : (
                <p>{assessment.aiResult.comment}</p>
              )}
              <button type="button" onClick={handleRetry}>
                別のゴミを撮影
              </button>
              <button type="button" onClick={handleClose}>
                閉じる
              </button>
            </div>
          )}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-label="ごみを投稿する"
        onClick={() => setIsOpen(!isOpen)}
        style={{ marginBottom: isOpen ? "0" : "15px" }}
      >
        [ ごみを投稿する ]
      </button>
    </>
  );
}
