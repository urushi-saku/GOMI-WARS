import { Link } from "react-router-dom";
import MapContainer from "../components/MapContainer";

export default function Home() {
  return (
    <div>
      <Link to="/signup">ユーザ登録画面へ</Link>
      <br />
      <Link to="/login">ログイン画面へ</Link>
      <MapContainer></MapContainer>
    </div>
  );
}
