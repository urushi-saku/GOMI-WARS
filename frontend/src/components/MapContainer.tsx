import { Map } from "@vis.gl/react-google-maps";
import { cyberpunkMapStyles } from "./MapStyles";

export default function MapContainer() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", zIndex: 1, flex: 1, display: "flex" }}>
      <Map
        style={{ width: "100%", height: "100%", flex: 1 }}
        defaultCenter={{ lat: 35.6809591, lng: 139.7673068 }}
        defaultZoom={10}
        styles={cyberpunkMapStyles} // カスタムスタイルを適用
        gestureHandling={"greedy"} // 1本指での地図の操作を可能に
        disableDefaultUI={true} // デフォルトのGoogle MapsのUIを削除
      ></Map>
    </div>
  );
}
