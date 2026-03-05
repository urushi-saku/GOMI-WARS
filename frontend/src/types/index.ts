import { Timestamp, GeoPoint } from "firebase/firestore";

/** ユーザープロフィール（/users/{userId}） */
export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalPoints: number;
  totalPickups: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** ゴミ拾い記録（/pickups/{pickupId}） */
export interface Pickup {
  id?: string;
  userId: string;
  userDisplayName: string;
  itemName: string;
  category: GarbageCategory;
  point: number;
  comment: string;
  imageURL: string; // Storage のダウンロード URL
  location?: GeoPoint; // 緯度経度
  locationName?: string; // 地名（逆ジオコーディング）
  createdAt: Timestamp;
}

/** ゴミのカテゴリ */
export type GarbageCategory =
  | "plastic"
  | "cigarette"
  | "paper"
  | "can"
  | "glass"
  | "other";

/** Gemini 査定結果 */
export interface AssessmentResult {
  is_trash: boolean
  type: string
  material: string
  points: number
  comment: string
  is_suspicious?: boolean
}

/** ランキング（/rankings/{period}） */
export interface Ranking {
  period: "weekly" | "monthly" | "alltime";
  updatedAt: Timestamp;
  entries: RankingEntry[];
}

export interface RankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  totalPoints: number;
  totalPickups: number;
}
