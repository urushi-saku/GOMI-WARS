import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";

export default function GarbageButton() {
  // 未認証状態でのゴミ投稿ボタン

  // 投稿ボタンorモーダルの×ボタンがクリックされたかでトグル
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // フォーカス管理: 初期フォーカス・Tabトラップ・Escapeで閉じる
  useDialogFocusTrap(isOpen, dialogRef, triggerRef, () => setIsOpen(false));

  return (
    <>
      {isOpen && (
        // ログインを促すモーダル
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
        >
          <h2 id="login-modal-title">ログインが必要です</h2>
          <Link to="/login">ログインする</Link>
          <button type="button" aria-label="モーダルを閉じる" onClick={() => setIsOpen(false)}>
            X
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
