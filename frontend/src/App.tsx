import { useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import "./App.css";
import Signup from "./page/Signup";
import Home from "./page/Home";
import Login from "./page/Login";
import InitialProfile from "./page/InitialProfile";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const currentPath = locationRef.current.pathname;
        if (currentPath === "/signup") {
          navigate("/welcome", { replace: true }); // 新規登録後の遷移先
        } else if (currentPath !== "/welcome") {
          navigate("/", { replace: true }); // ログイン後の遷移先
        }
      }
    });
    return () => unsubscribe();
  }, [navigate, auth]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/welcome" element={<InitialProfile />}></Route>
      </Routes>
    </>
  );
}

export default App;
