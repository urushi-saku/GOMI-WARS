import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import type { User } from "firebase/auth";
import { Link } from "react-router-dom";

export default function HamburgerIcon() {
  const [isClicked, setIsClicked] = useState(false);
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

  const menu = (
    <>
      {user ? (
        <button onClick={handleSignOut}>ログアウト</button>
      ) : (
        <>
          <Link to="/login">ログイン</Link>
          <Link to="/signup">新規登録</Link>
        </>
      )}
    </>
  );

  return (
    <>
      <button onClick={() => setIsClicked(!isClicked)}>
        {isClicked ? "x" : "≡"}
      </button>
      {isClicked ? menu : null}
    </>
  );
}
