import { APIProvider, Map } from "@vis.gl/react-google-maps";

export default function MapContainer() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div>
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: "100vw", height: "100vh" }}
          defaultCenter={{ lat: 35.6812, lng: 139.7671 }}
          defaultZoom={18}
          gestureHandling="greedy"
          disableDefaultUI
        ></Map>
      </APIProvider>
      {/* ここにHighlightMap.tsxコンポーネントを書く */}
    </div>
  );
}
