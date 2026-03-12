import { useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, API_BASE_URL } from "./lib/firebase";
import { createUserDocIfNotExists } from "./utils/authUtils";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";
import Signup from "./page/Signup";
import Home from "./page/Home";
import Login from "./page/Login";
import InitialProfile from "./page/InitialProfile";
import Profile from "./page/Profile";
import PrivateRoute from "./components/PrivateRoute";

/**
 * App メインコンポーネント
 * 認証状態を監視し、ユーザーのログイン状態に応じてページを切り替える
 */
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authLoading } = useAuth();

  // アプリ起動時に Render サーバーをウォームアップ（スリープ解除）
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`).catch(() => {
      // サーバーがまだ起動中の場合などは無視してよい
    });
  }, []);

  // useLocation は再レンダリングのたびに新しいオブジェクトが作成されるため
  // useRef で保持して onAuthStateChanged 内で最新の pathname を参照できるようにする
  const locationRef = useRef(location);

  // location が変更されるたびに locationRef を更新
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  /**
   * ログイン完了後のリダイレクト処理
   * AuthContext の user を監視することで onAuthStateChanged リスナーを1本に集約する
   * - authLoading 中はスキップ（初期化完了前の誤発火を防ぐ）
   * - user が null（未ログイン）はスキップ（PrivateRoute が担当）
   * - /signup → /welcome（プロフィール初期設定画面）
   * - /login  → Firestore ドキュメント確認 → /（ホーム画面）
   */
  useEffect(() => {
    if (authLoading || !user) return;

    const currentPath = locationRef.current.pathname;

    if (currentPath === "/signup") {
      // 新規登録フロー: /signup → /welcome
      navigate("/welcome", { replace: true });
    } else if (currentPath === "/login") {
      // ログインフロー: Firestore ドキュメント確認 → /
      const run = async () => {
        try {
          await createUserDocIfNotExists(user);
          navigate("/", { replace: true });
        } catch {
          // Firestore への書き込み失敗時はサインアウトしてログインページへ戻す
          await signOut(auth);
          navigate("/login", {
            replace: true,
            state: { error: "アカウント情報の保存に失敗しました。再度ログインしてください。" },
          });
        }
      };
      run();
    }
    // /welcome と /profile は PrivateRoute が担当するため追加制御不要
  }, [user, authLoading, navigate]);

  // Firebase Auth の初期化完了まで全画面ローディングを表示し、UIのチラつき（フラッシュ）を防ぐ
  // TODO: CSS担当者 → 以下のインラインスタイルをグローバルCSSクラスに移行してください
  if (authLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        color: "var(--cy-cyan, #00f3ff)",
        fontFamily: "var(--font-display)",
        fontSize: "1.1rem",
        letterSpacing: "4px",
        background: "var(--cy-bg, #000a14)",
      }}>
        同期中...
      </div>
    );
  }

  return (
    <>
      {/* ルーティング定義 */}
      <Routes>
        {/* パブリックルート（認証不要） */}
        <Route path="/" element={<Home />} />                   {/* ホーム画面 */}
        <Route path="/signup" element={<Signup />} />          {/* 新規登録画面 */}
        <Route path="/login" element={<Login />} />            {/* ログイン画面 */}

        {/* プライベートルート（未ログインは /login へリダイレクト） */}
        <Route path="/welcome" element={<PrivateRoute><InitialProfile /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default App;
