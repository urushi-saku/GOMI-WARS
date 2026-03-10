import { useState, useRef } from "react";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";

export default function GarbageButtonAuth() {
  // 認証状態でのゴミ投稿ボタン

  // 投稿ボタンorモーダルの×ボタンがクリックされたかでトグル
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // フォーカス管理: 初期フォーカス・Tabトラップ・Escapeで閉じる
  useDialogFocusTrap(isOpen, dialogRef, triggerRef, () => setIsOpen(false));

  const handlePostClick = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log(`Latitude: ${lat} | Longitude: ${lng}`);
        setIsOpen(false);
      },
      (error) => {
        console.error(error.message);
      },
    );
  };

  return (
    <>
      {isOpen && (
        // ゴミ投稿用のモーダル
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="garbage-modal-title"
        >
          <h2 id="garbage-modal-title">ゴミの画像を投稿</h2>
          <label htmlFor="garbage-post">画像を添付</label>
          <input type="file" id="garbage-post" />
          <button onClick={handlePostClick}>投稿</button>
          <button
            type="button"
            aria-label="モーダルを閉じる"
            onClick={() => setIsOpen(false)}
          >
            x
          </button>
        </div>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-label="ゴミ投稿フォームを開く"
        onClick={() => setIsOpen(true)}
      >
        +
      </button>
    </>
  );
}
