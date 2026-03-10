import { useState } from "react";
import { Link } from "react-router-dom";
import { googleLogin, signupWithEmail } from "../utils/authUtils";
import styles from "./Signup.module.css";
import styles from "./Signup.module.css";
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
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title} data-text="REGISTER">REGISTER</h1>
        <p className={styles.subtitle}>// NEW AGENT INITIALIZATION //</p>
      </header>

      <form className={styles.formPanel} onSubmit={handleSignup}>
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

        <button type="submit" className={styles.actionButton}>[ 登録する ]</button>
        <button type="button" onClick={handleGoogleSignup} className={styles.googleButton}>
          [ Googleで登録 ]
        </button>
      </form>

      <Link to="/" className={styles.backLink}>&lt; トップシステムへ戻る</Link>
    </div>
  );
}
