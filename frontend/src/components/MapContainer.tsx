import { useState } from "react";
import { Map, type MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { cyberpunkMapStyles, zoomedInCyberpunkMapStyles } from "./MapStyles";
import SquareRenderer from "./SquareRenderer";
import squaresData from "../data/squares.json";

export default function MapContainer() {
  // マップの現在のズームレベルを管理 (初期値10はデフォルトと合わせる)
  const [zoomLevel, setZoomLevel] = useState(10);
  
  // ズーム閾値（この値以上のズームで市町村境界がネオン調に光る）
  const ZOOM_THRESHOLD = 12;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", zIndex: 1, flex: 1, display: "flex" }}>
      <Map
        style={{ width: "100%", height: "100%", flex: 1 }}
        defaultCenter={{ lat: 35.6809591, lng: 139.7673068 }}
        defaultZoom={10}
        minZoom={5} // これ以上縮小できないように制限（日本全土が入るくらい）
        // ズームレベルに応じてスタイルを動的に切り替え
        styles={zoomLevel >= ZOOM_THRESHOLD ? zoomedInCyberpunkMapStyles : cyberpunkMapStyles} 
        gestureHandling={"greedy"} 
        disableDefaultUI={true}
        // ユーザーがカメラ（ズーム/パン）を操作した際にズームレベルを状態として更新する
        onCameraChanged={(ev: MapCameraChangedEvent) => {
          setZoomLevel(ev.detail.zoom);
        }}
      >
        {/* 正方形のエリアを描画するコンポーネントを追加 */}
        <SquareRenderer squaresData={squaresData} />
      </Map>
    </div>
  );
}
