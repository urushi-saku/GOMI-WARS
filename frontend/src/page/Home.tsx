// import { onAuthStateChanged } from "firebase/auth";
import HamburgerIcon from "../components/HamburgerIcon";
// import { auth } from "../lib/firebase";
// import { useEffect, useState } from "react";
// import type { User } from "firebase/auth";
import MapContainer from "../components/MapContainer";

export default function Home() {
  /* const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);
  */

  // コメント部分はゴミ投稿ボタンで利用する

  return (
    <div>
      <HamburgerIcon />
      <MapContainer></MapContainer>
    </div>
  );
}
