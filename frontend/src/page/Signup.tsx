import { useState } from "react";
import { googleLogin, signupWithEmail } from "../utils/authUtils";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // ボタンが押されてもリロードしない

    try {
      await signupWithEmail(email, password);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await googleLogin();
      // TODO: Add Firebase authentication handling once backend API endpoints are available.
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2>新規登録</h2>
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
