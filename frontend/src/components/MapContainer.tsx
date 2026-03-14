import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Map, type MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { cyberpunkMapStyles, zoomedInCyberpunkMapStyles } from "./MapStyles";
import SquareRenderer from "./SquareRenderer";

interface GridDoc {
  latIndex: number;
  lngIndex: number;
  ownerUid: string;
}

interface SquareData {
  id: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
}

// ownerUid を固定色 (HSL) に変換する
function uidToColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash) + uid.charCodeAt(i);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 100%, 60%)`;
}

// グリッドインデックスから中心座標を計算
// latIndex = floor(lat * 10) なので中心は (latIndex + 0.5) / 10
const GRID_SIZE_METERS = 11111; // 0.1度 ≈ 11111m

export default function MapContainer() {
  const [zoomLevel, setZoomLevel] = useState(10);
  const [squaresData, setSquaresData] = useState<SquareData[]>([]);

  const ZOOM_THRESHOLD = 12;

  // Firestore の grids コレクションをリアルタイム購読
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "grids"), (snapshot) => {
      const squares: SquareData[] = snapshot.docs.map((doc) => {
        const data = doc.data() as GridDoc;
        return {
          id: doc.id,
          lat: (data.latIndex + 0.5) / 10,
          lng: (data.lngIndex + 0.5) / 10,
          size: GRID_SIZE_METERS,
          color: uidToColor(data.ownerUid),
        };
      });
      setSquaresData(squares);
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", zIndex: 1, flex: 1, display: "flex" }}>
      <Map
        style={{ width: "100%", height: "100%", flex: 1 }}
        defaultCenter={{ lat: 35.6809591, lng: 139.7673068 }}
        defaultZoom={10}
        minZoom={5}
        styles={zoomLevel >= ZOOM_THRESHOLD ? zoomedInCyberpunkMapStyles : cyberpunkMapStyles}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        onCameraChanged={(ev: MapCameraChangedEvent) => {
          setZoomLevel(ev.detail.zoom);
        }}
      >
        <SquareRenderer squaresData={squaresData} />
      </Map>
    </div>
  );
}

