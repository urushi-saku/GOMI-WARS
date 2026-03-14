import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Map, useMap, type MapCameraChangedEvent } from "@vis.gl/react-google-maps";
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

// 現在地ボタン（Map の子として useMap() でインスタンスにアクセス）
function LocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleClick = () => {
    if (!map || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        map.setZoom(15);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={locating}
      style={{
        position: "absolute",
        bottom: "20px",
        right: "10px",
        zIndex: 10,
        width: "44px",
        height: "44px",
        padding: 0,
        background: "rgba(0, 10, 20, 0.85)",
        border: "1px solid var(--cy-cyan, #00f3ff)",
        color: locating ? "rgba(0,243,255,0.4)" : "var(--cy-cyan, #00f3ff)",
        fontSize: "1.3rem",
        cursor: locating ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 10px rgba(0,243,255,0.3)",
        transition: "all 0.2s",
      }}
      aria-label="現在地に移動"
    >
      ⊕
    </button>
  );
}

export default function MapContainer() {
  const [zoomLevel, setZoomLevel] = useState(10);
  const [squaresData, setSquaresData] = useState<SquareData[]>([]);

  const ZOOM_THRESHOLD = 12;

  // Firestore の grids コレクションをリアルタイム購読
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "grids"),
      (snapshot) => {
        console.log("[MapContainer] grids snapshot 件数:", snapshot.size);
        const squares: SquareData[] = snapshot.docs.map((doc) => {
          const data = doc.data() as GridDoc;
          const sq = {
            id: doc.id,
            lat: (data.latIndex + 0.5) / 10,
            lng: (data.lngIndex + 0.5) / 10,
            size: GRID_SIZE_METERS,
            color: uidToColor(data.ownerUid),
          };
          console.log("[MapContainer] grid:", sq);
          return sq;
        });
        setSquaresData(squares);
      },
      (error) => {
        console.error("[MapContainer] grids onSnapshot error:", error.code, error.message);
      }
    );
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
        <LocationButton />
      </Map>
    </div>
  );
}
