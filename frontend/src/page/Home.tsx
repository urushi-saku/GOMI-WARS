import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import MapContainer from "../components/MapContainer";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);
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

  const logoutButton = <button onClick={handleSignOut}>ログアウト</button>;
  return (
    <div>
      <Link to="/signup">ユーザ登録画面へ</Link>
      <br />
      <Link to="/login">ログイン画面へ</Link>
      <br />
      {user ? logoutButton : null}
      <MapContainer></MapContainer>
    </div>
  );
}
