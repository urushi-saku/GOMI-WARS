import { useState } from "react";
import { Link } from "react-router-dom";
import { googleLogin, loginWithEmail } from "../utils/authUtils";
import styles from "./Login.module.css";
import { useLocation } from "react-router-dom";
import styles from "./Login.module.css";
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
