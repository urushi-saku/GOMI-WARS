import { auth, API_BASE_URL } from "../lib/firebase";

export interface RankingEntry {
  rank: number;
  uid: string;
  displayName: string;
  photoURL: string | null;
  totalPoint: number;
}

export interface RankingResponse {
  ranking: RankingEntry[];
  myRank: number | null;
  myEntry: RankingEntry | null;
}

/**
 * バックエンドから上位ランキングと自分の順位を取得する
 * 未ログイン時は myRank が null になる
 */
export async function fetchRanking(limit = 20): Promise<RankingResponse> {
  const headers: Record<string, string> = {};

  // ログイン済みなら idToken をセット（オプション）
  const currentUser = auth.currentUser;
  if (currentUser) {
    const idToken = await currentUser.getIdToken();
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/ranking?limit=${limit}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? `HTTP ${res.status}`
    );
  }

  return res.json() as Promise<RankingResponse>;
}
