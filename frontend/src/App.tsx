import { Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Signup from "./page/Signup";

function App() {
  return (
    <>
      <Link to="/signup">ユーザ登録</Link>
      <Routes>
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  );
}

export default App;
