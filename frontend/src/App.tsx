import { Routes, Route } from "react-router-dom";
import "./App.css";
import Signup from "./page/Signup";
import Home from "./page/Home";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  );
}

export default App;
