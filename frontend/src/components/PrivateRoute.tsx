import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  children: React.ReactNode;
}

/**
 * 認証ガード
 * - authLoading 中は何も返さない（App.tsx のグローバルローディング画面が表示される）
 * - 未ログインなら /login へリダイレクト
 * - ログイン済みなら子要素をそのまま描画
 */
export default function PrivateRoute({ children }: Props) {
  const { user, authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
