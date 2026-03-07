import { Link } from "react-router-dom";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <div>
      <Link to="/signup">ユーザ登録画面へ</Link>
      <br />
      <Link to="/login">ログイン画面へ</Link>
    </div>
  );
}
