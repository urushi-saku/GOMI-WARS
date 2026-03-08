import { useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { createUserDocIfNotExists } from "./utils/authUtils";
import "./App.css";
import Signup from "./page/Signup";
import Home from "./page/Home";
import Login from "./page/Login";
import InitialProfile from "./page/InitialProfile";

/**
 * App メインコンポーネント
 * 認証状態を監視し、ユーザーのログイン状態に応じてページを切り替える
 */
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // useLocation は再レンダリングのたびに新しいオブジェクトが作成されるため
  // useRef で保持して onAuthStateChanged 内で最新の pathname を参照できるようにする
  const locationRef = useRef(location);

  // location が変更されるたびに locationRef を更新
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  /**
   * Firebase 認証状態の監視
   * ユーザーのログイン/ログアウト状態が変わるたびに実行される
   */
  useEffect(() => {
    // Firebase の認証状態が変わるリスナーを登録
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ユーザーがログイン中の場合の処理
        const currentPath = locationRef.current.pathname;
        
        if (currentPath === "/signup") {
          // 新規登録フロー: /signup → /welcome（プロフィール初期設定画面へ)
          navigate("/welcome", { replace: true });
        } else if (currentPath === "/login") {
          // ログインフロー: /login → Firestoreドキュメント確認 → /（ホーム画面へ）
          // Google ログインやメールログイン後、Firestoreに既にドキュメントがあるかチェック
          // なければ新規作成（既にあれば何もしない - べき等性を保証）
          await createUserDocIfNotExists(user);
          navigate("/", { replace: true });
        } else if (currentPath !== "/welcome") {
          // その他のページからのログイン時
          // /welcome ページ以外の場合はホーム画面へリダイレクト
          navigate("/", { replace: true });
        }
      }
    });
    
    // クリーンアップ: コンポーネントがアンマウントされたときリスナーを解除
    return () => unsubscribe();
  }, [navigate]);

  return (
    <>
      {/* ルーティング定義 */}
      <Routes>
        <Route path="/" element={<Home />} />                        {/* ホーム画面 */}
        <Route path="/signup" element={<Signup />} />              {/* 新規登録画面 */}
        <Route path="/login" element={<Login />} />                {/* ログイン画面 */}
        <Route path="/welcome" element={<InitialProfile />} />     {/* プロフィール初期設定画面 */}
      </Routes>
    </>
  );
}

export default App;
