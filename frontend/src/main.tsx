
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import { AuthProvider } from "./contexts/AuthContext";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error("VITE_GOOGLE_MAPS_API_KEY is not defined.");
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <APIProvider apiKey={apiKey!}>
        <App />
      </APIProvider>
    </AuthProvider>
  </BrowserRouter>
);
