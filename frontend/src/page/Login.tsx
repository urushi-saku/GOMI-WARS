import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // ボタンが押されてもリロードしない
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const idToken = user.getIdToken();
      console.log(`User is ${user} | ID Token is ${idToken}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    // APIキーが読み込めない。おそらく.envファイルがないから？
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      console.log(`User is ${user.displayName} | ID Token is ${idToken}`);

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
      />
      <button type="submit">ログイン</button>
      <button type="button" onClick={handleGoogleLogin}>
        Googleでログイン
      </button>
    </form>
  );
}
