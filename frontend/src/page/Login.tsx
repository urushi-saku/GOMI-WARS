import { useState } from "react";
import { googleLogin, loginWithEmail } from "../utils/authUtils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // ボタンが押されてもリロードしない
    try {
      await loginWithEmail(email, password);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    // TODO(#auth-google): Ensure Google login credentials are correctly configured via environment variables.
    try {
      await googleLogin();
      // TODO(#auth-google): Implement Firebase authentication and backend API integration, including explicit handling for non-OK responses.
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>ログイン</h2>
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
