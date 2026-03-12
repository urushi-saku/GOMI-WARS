import { Link } from "react-router-dom";
import type { User } from "firebase/auth";
import styles from "./ProfileIcon.module.css";

interface Props {
  user: User;
}

/** photoURL がない場合のデフォルトアバター */
function DefaultAvatar() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.avatarSvg}
    >
      <circle cx="20" cy="15" r="8" fill="#00f3ff" opacity="0.8" />
      <ellipse cx="20" cy="36" rx="13" ry="8" fill="#00f3ff" opacity="0.5" />
    </svg>
  );
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
        <DefaultAvatar />
      )}
    </Link>
  );
}
