import { useState, useRef, useCallback } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { auth, db, storage } from "../lib/firebase";
import type { GarbageCategory } from "../types";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { assessGarbage, fileToBase64 } from "../utils/assessApi";
import type { AssessmentResult } from "../types";

/**
 * モーダルの表示ステップ
 * - select  : カメラ起動（撮影待ち）
 * - preview : 撮影した画像のプレビュー＋査定ボタン
 * - result  : Gemini による査定結果の表示
 */
type ModalStep = "select" | "preview" | "result";

export default function GarbageButtonAuth() {
  // ログイン済みユーザー向けのゴミ投稿ボタン＋モーダル

  // モーダルの開閉状態
  const [isOpen, setIsOpen] = useState(false);
  // 現在のモーダルステップ
  const [step, setStep] = useState<ModalStep>("select");
  // カメラで撮影した File オブジェクト
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // プレビュー表示用の Object URL（使用後は revokeObjectURL で解放する）
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Render API 呼び出し中フラグ（二重送信防止にも使用）
  const [isLoading, setIsLoading] = useState(false);
  // Gemini 査定結果
  const [result, setResult] = useState<AssessmentResult | null>(null);
  // エラーメッセージ（API エラー・バリデーションエラー）
  const [error, setError] = useState<string | null>(null);

  // モーダル DOM への参照（フォーカス管理に使用）
  const dialogRef = useRef<HTMLDivElement>(null);
  // 起動ボタンへの参照（モーダルを閉じた後にフォーカスを戻すために使用）
  const triggerRef = useRef<HTMLButtonElement>(null);
  // カメラ input への参照（撮り直し時に value をリセットして same-file issue を防ぐ）
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /**
   * モーダルを閉じてすべての状態をリセットする
   * Object URL のメモリリークを防ぐため revokeObjectURL も実行する
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setStep("select");
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, [previewUrl]);

  /**
   * カメラで撮影した画像を受け取りプレビューステップへ進む
   * 不正防止のため capture="environment" でその場撮影のみ許可している
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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setStep("preview");
    },
    [previewUrl]
  );

  /**
   * 撮影した画像を Render の /api/assess エンドポイントに送信して査定を受ける
   * 1. Geolocation API で現在地を取得（拒否された場合は location なしで送信）
   * 2. File を Base64 に変換
   * 3. Firebase ID トークンを付与して API へ POST
   * 4. レスポンスを result ステートに格納して結果ステップへ
   */
  const handleAssess = useCallback(async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // 位置情報を取得（許可されていない場合はスキップ）
      let location: { lat: number; lng: number } | undefined;
      if (navigator.geolocation) {
        location = await new Promise<{ lat: number; lng: number } | undefined>(
          (resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              // 拒否・タイムアウトは undefined で resolve してスキップ
              () => resolve(undefined),
              { timeout: 5000 }
            );
          }
        );
      }

      const { imageBase64, mimeType } = await fileToBase64(selectedFile);
      const assessment = await assessGarbage({ imageBase64, mimeType, location });

      setResult(assessment);
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
   * input の value を空文字にリセットしないと、直前と全く同じファイル名で撮り直した際に
   * onChange が発火しない same-file issue が起きるため明示的にリセットする
   */
  const handleRetry = useCallback(() => {
    setStep("select");
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, [previewUrl]);

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

          {/* ── ステップ 1: カメラ撮影 ── */}
          {step === "select" && (
            <>
              <h2 id="garbage-modal-title">ゴミを撮影する</h2>
              {error && <p role="alert">{error}</p>}
              <label htmlFor="garbage-camera">
                📷 カメラで撮影
                <input
                  ref={cameraInputRef}
                  type="file"
                  id="garbage-camera"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
            </>
          )}

          {/* ── ステップ 2: プレビュー & 査定 ── */}
          {step === "preview" && previewUrl && (
            <>
              <h2 id="garbage-modal-title">ゴミを査定する</h2>
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
            </>
          )}

          {/* ── ステップ 3: 査定結果 ── */}
          {step === "result" && result && (
            <>
              <h2 id="garbage-modal-title">
                {result.is_trash ? "査定結果" : "ゴミではありません"}
              </h2>
              {result.is_trash ? (
                <>
                  <p>
                    <strong>{result.type}</strong>（{result.material}）
                  </p>
                  <p>獲得ポイント: <strong>{result.points} pt</strong></p>
                  <p>{result.comment}</p>
                  {result.is_suspicious && (
                    <p role="alert">⚠️ 不審な画像と判定されました</p>
                  )}
                </>
              ) : (
                <p>{result.comment}</p>
              )}
              <button type="button" onClick={handleRetry}>
                別のゴミを撮影
              </button>
              <button type="button" onClick={handleClose}>
                閉じる
              </button>
            </>
          )}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-label="ゴミ投稿フォームを開く"
        onClick={() => setIsOpen(true)}
      >
        +
      </button>
    </>
  );
}
