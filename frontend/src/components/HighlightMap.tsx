import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { db } from "../lib/firebase"; // Firestore
import { collection, onSnapshot } from "firebase/firestore";

export default function HighlightMap() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const circles: google.maps.Circle[] = []; // 円を管理する配列

    const unsubscribe = onSnapshot(collection(db, "scans"), (snapshot) => {
      // 新しいデータが来る前に古い円を地図から消す
      circles.forEach((c) => c.setMap(null));
      circles.length = 0;

      snapshot.docs.forEach((doc) => {
        const { lat, lng } = doc.data();
        const circle = new google.maps.Circle({
          map,
          center: { lat, lng },
          radius: 100,
          fillColor: "#FF0000",
          strokeWeight: 0,
        });
        circles.push(circle); // 配列に保存
      });
    });

    return () => {
      unsubscribe();
      circles.forEach((c) => c.setMap(null)); // コンポーネント消滅時に円も消す
    };
  }, [map]);
  return null;
}
