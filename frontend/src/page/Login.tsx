import { useState } from "react";
import styles from "./Login.module.css";
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
    try {
      await googleLogin();
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
