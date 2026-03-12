import { useEffect, useState } from "react";

export type CameraPermissionState = "granted" | "denied" | "prompt" | "unsupported";

/**
 * カメラパーミッションの状態を監視するカスタムフック
 *
 * - Permissions API 非対応環境（Firefox 等）は "unsupported" を返して通常フロー継続
 * - "camera" クエリ非対応のブラウザも同様に "unsupported" にフォールバック
 * - permissionStatus.onchange でリアクティブに状態変化を追従する
 *   （ユーザーが設定でカメラを許可 → モーダル内の表示が自動更新される）
 *
 * Note: この権限は getUserMedia ベース。
 *       <input type="file" capture> はOS/ブラウザ側で制御されるため
 *       API の状態と完全に一致しない場合があるが、"denied" のときに
 *       ユーザーへ設定変更を案内するには十分な精度がある。
 */
export function useCameraPermission(): CameraPermissionState {
  const [state, setState] = useState<CameraPermissionState>("prompt");

  useEffect(() => {
    if (!navigator.permissions) {
      setState("unsupported");
      return;
    }

    let permissionStatus: PermissionStatus;

    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((status) => {
        permissionStatus = status;
        setState(status.state as CameraPermissionState);

        // 権限変更（設定画面での許可/拒否）をリアクティブに追従
        status.onchange = () => {
          setState(status.state as CameraPermissionState);
        };
      })
      .catch(() => {
        // "camera" という PermissionName を認識しないブラウザは通常フローで継続
        setState("unsupported");
      });

    return () => {
      // クリーンアップ: リスナーを解除してメモリリークを防ぐ
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  return state;
}
