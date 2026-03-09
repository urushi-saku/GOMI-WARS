import { onAuthStateChanged } from "firebase/auth";
import HamburgerIcon from "../components/HamburgerIcon";
import { auth } from "../lib/firebase";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import MapContainer from "../components/MapContainer";
import GarbageButton from "../components/GarbageButton";
import GarbageButtonAuth from "../components/GarbageButtonAuth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <HamburgerIcon />
      {user ? <GarbageButtonAuth /> : <GarbageButton />}
      <MapContainer></MapContainer>
    </div>
  );
}
