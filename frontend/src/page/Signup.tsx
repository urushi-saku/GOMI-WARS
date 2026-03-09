import { useState } from "react";
import { googleLogin, signupWithEmail, getAuthErrorMessage } from "../utils/authUtils";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await signupWithEmail(email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      await googleLogin();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2>新規登録</h2>
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
      <button type="submit">登録する</button>
      <button type="button" onClick={handleGoogleSignup}>
        Googleでログイン
      </button>
    </form>
  );
}
