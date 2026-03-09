import { useState } from "react";
import { useLocation } from "react-router-dom";
import { googleLogin, loginWithEmail, getAuthErrorMessage } from "../utils/authUtils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    // App.tsx から navigate で渡されたエラーメッセージがあれば初期値にセット
    (useLocation().state as { error?: string } | null)?.error ?? null
  );

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await googleLogin();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>ログイン</h2>
      {/* エラーメッセージと「やり直し」の案内 */}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <p>内容を確認して再度お試しください。</p>
        </div>
      )}
      <input
        type="email"
        placeholder="メールアドレスを入力"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="パスワードを入力"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">ログイン</button>
      <button type="button" onClick={handleGoogleLogin}>
        Googleでログイン
      </button>
    </form>
  );
}
