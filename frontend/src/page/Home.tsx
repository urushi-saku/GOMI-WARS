import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import MapContainer from "../components/MapContainer";
import GarbageButtonAuth from "../components/GarbageButtonAuth";
import GarbageButton from "../components/GarbageButton";
import ProfileIcon from "../components/ProfileIcon";
import styles from "./Home.module.css";

export default function Home() {
  // AuthContext から user を取得（独自リスナー不要）
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to sign out:", error);
      window.alert(
        "ログアウトに失敗しました。時間をおいて再度お試しください。",
      );
    }
  };

  return (
    <div className={styles.homeContainer}>
      {/* ネオン風のタイトルヘッダー */}
      <header className={styles.header}>
        <h1 className={styles.title} data-text="GOMI WARS">
          GOMI WARS
        </h1>
      </header>

      <div className={styles.dashboard}>
        {/* 左側（スマホでは上）：操作パネル */}
        <div className={styles.controlPanel}>
          <div className={styles.panelHeader}>
            <span>SYS_CTRL</span>
            <div className={styles.statusIndicator}></div>
          </div>

          <div className={styles.buttonContainer}>
            {!user ? (
              <>
                <Link to="/signup" className={styles.actionButton}>
                  [ ユーザ登録 ]
                </Link>
                <Link to="/login" className={styles.actionButton}>
                  [ ログイン ]
                </Link>
              </>
            ) : (
              <>
                {user ? <GarbageButtonAuth /> : <GarbageButton />}
                <button onClick={handleSignOut} className={styles.actionButton}>
                  [ ログアウト ]
                </button>
              </>
            )}
          </div>

          <div className={styles.panelFooter}>CONNECTION: SECURE</div>
        </div>

        {/* 右側（スマホでは下）：マップエリア */}
        <div className={styles.mapSection}>
          <div className={styles.mapOverlay}>
            <span className={styles.mapLabel}>TERRITORY SCANNER</span>
            <span className={styles.mapCoords}>LAT:35.68 LNG:139.76</span>
          </div>
          {user && <ProfileIcon user={user} />}
          <MapContainer />
        </div>
      </div>
    </div>
  );
}
