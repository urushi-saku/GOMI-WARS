import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { saveInitialProfile } from "../utils/authUtils";

/**
 * InitialProfile コンポーネント
 * メール登録またはGoogle登録直後に表示される
 * ユーザーにユーザー名とプロフィール画像の設定を促す画面
 */
export default function InitialProfile() {
  const navigate = useNavigate();
  
  // フォーム入力値の状態管理
  const [displayName, setDisplayName] = useState("");      // ユーザーが入力したユーザー名
  const [photoFile, setPhotoFile] = useState<File | null>(null); // 選択されたプロフィール画像ファイル
  
  // UI状態の管理
  const [loading, setLoading] = useState(false);          // フォーム送信中かどうか
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  /**
   * フォーム送信ハンドラ
   * ユーザー名と画像をFirebaseに保存し、ホーム画面へ遷移
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 現在ログイン中のユーザーを取得
    const user = auth.currentUser;
    if (!user) {
      // セッション切れや予期しない離脱時はログインページへ誘導
      navigate("/login", {
        replace: true,
        state: { error: "セッションが切れました。再度ログインしてください。" },
      });
      return;
    }

    // trim後に空文字になる場合（スペースのみ入力）は登録不可
    if (displayName.trim() === "") {
      setError("ユーザー名を入力してください。");
      return;
    }

    // 空白文字（スペース・全角スペース・タブ）が含まれている場合は登録不可
    if (/[\s\u3000]/.test(displayName)) {
      setError("ユーザー名にスペースは使用できません。");
      return;
    }

    // ローディング状態を有効化
    setLoading(true);
    setError(null);
    
    try {
      // authUtils.ts の saveInitialProfile を呼び出し
      // Firebase Auth + Firestore + Storage に保存
      await saveInitialProfile(user, displayName, photoFile);
      
      // プロフィール設定完了後、ホーム画面（/）へ遷移
      navigate("/", { replace: true });
    } catch (err) {
      // エラーが発生した場合、ユーザーに通知
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      // ローディング状態を解除
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>プロフィール設定</h2>
      
      {/* プロフィール画像入力 */}
      <label htmlFor="profile-image">プロフィール画像</label>
      {/* 画像ファイルのみ受け付ける。ファイル選択時に状態を更新 */}
      <input
        type="file"
        id="profile-image"
        accept="image/*"
        onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
      />
      
      {/* ユーザー名入力。必須項目で1～20文字に制限 */}
      <label htmlFor="username">ユーザ名</label>
      <input
        type="text"
        id="username"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
        minLength={1}
        maxLength={20}
      />
      
      {/* エラーメッセージ表示 */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {/* 送信ボタン（ローディング中は無効化） */}
      <button type="submit" disabled={loading}>
        {loading ? "保存中..." : "プロフィールを確定"}
      </button>
    </form>
  );
}
