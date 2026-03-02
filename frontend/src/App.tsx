import { Routes, Route } from "react-router-dom";
import "./App.css";
import Signup from "./page/Signup";
import Home from "./page/Home";
import Login from "./page/Login";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
