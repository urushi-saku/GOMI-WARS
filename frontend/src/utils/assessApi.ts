import { auth, API_BASE_URL } from "../lib/firebase";
import type { AssessmentResult } from "../types";

export interface AssessPayload {
  imageBase64: string;
  mimeType: string;
  location?: { lat: number; lng: number };
}

/**
 * ゴミ画像を Render の /api/assess に送信して査定結果を取得する
 */
export async function assessGarbage(
  payload: AssessPayload
): Promise<AssessmentResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("ログインが必要です");
  }

  const idToken = await currentUser.getIdToken();

  const res = await fetch(`${API_BASE_URL}/api/assess`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<AssessmentResult>;
}

/**
 * File オブジェクトを canvas で圧縮してから { imageBase64, mimeType } に変換する
 *
 * - 長辺を MAX_SIDE px 以下にリサイズ（小さい画像はそのまま）
 * - JPEG 品質 QUALITY に変換することでファイルサイズを削減
 * - スマホ撮影（4〜10MB）を概ね 500KB〜1MB 程度に抑えられる
 */
const MAX_SIDE = 1280; // px
const QUALITY = 0.8;   // 0.0〜1.0

export function fileToBase64(
  file: File
): Promise<{ imageBase64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // リサイズ比率の計算（長辺が MAX_SIDE を超える場合のみ縮小）
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas の初期化に失敗しました"));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      // canvas → JPEG Base64（data URL の先頭部分を除去して純粋な Base64 のみ取得）
      const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
      const imageBase64 = dataUrl.split(",")[1];
      resolve({ imageBase64, mimeType: "image/jpeg" });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("ファイルの読み込みに失敗しました"));
    };

    img.src = objectUrl;
  });
}
