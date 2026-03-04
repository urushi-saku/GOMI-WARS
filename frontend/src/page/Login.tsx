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
    // APIキーが読み込めない。おそらく.envファイルがないから？
    try {
      await googleLogin();
      /* Firebase認証のためのコードをここに書く。BackendのAPIのエンドポイントが必要。また、一部のエラーはcatch文に入らないため、"!response.ok"からエラーを投げるように*/
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
