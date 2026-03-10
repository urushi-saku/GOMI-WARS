import { useState } from "react";
import { Link } from "react-router-dom";
import { googleLogin, loginWithEmail } from "../utils/authUtils";
import styles from "./Login.module.css";

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
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title} data-text="LOGIN">LOGIN</h1>
        <p className={styles.subtitle}>// AUTHENTICATION REQUIRED //</p>
      </header>

      <form className={styles.formPanel} onSubmit={handleLogin}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>EMAIL_ADDRESS</label>
          <input
            className={styles.inputField}
            type="email"
            placeholder="メールアドレスを入力"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>PASSWORD_KEY</label>
          <input
            className={styles.inputField}
            type="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={styles.actionButton}>[ ログイン実行 ]</button>
        <button type="button" onClick={handleGoogleLogin} className={styles.googleButton}>
          [ Googleでログイン ]
        </button>
      </form>

      <Link to="/" className={styles.backLink}>&lt; トップシステムへ戻る</Link>
    </div>
  );
}
