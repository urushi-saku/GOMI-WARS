import { Link } from "react-router-dom";
import type { User } from "firebase/auth";
import styles from "./ProfileIcon.module.css";

interface Props {
  user: User;
}

/**
 * HUD風プロフィールアイコン
 * マップ右上に浮かせて表示し、タップで /profile へ遷移する
 */
export default function ProfileIcon({ user }: Props) {
  return (
    <Link to="/profile" className={styles.hudIcon} aria-label="プロフィール">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt="プロフィール"
          className={styles.avatar}
          referrerPolicy="no-referrer"
        />
      ) : (
        <img
          src="/default-avatar.svg"
          alt="デフォルトアバター"
          className={styles.avatar}
        />
      )}
    </Link>
  );
}
