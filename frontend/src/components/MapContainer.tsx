import { APIProvider, Map } from "@vis.gl/react-google-maps";

export default function MapContainer() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <APIProvider apiKey={apiKey}>
      {/* API ProviderでGoogle Map関連のコンポ―ネントを囲む */}
      <Map
        style={{ width: "100vw", height: "100vh" }}
        defaultCenter={{ lat: 35.6809591, lng: 139.7673068 }}
        defaultZoom={18}
        gestureHandling={"greedy"} // 1本指での地図の操作を可能に
        disableDefaultUI // デフォルトのGoogle MapsのUIを削除
      ></Map>
    </APIProvider>
  );
}
