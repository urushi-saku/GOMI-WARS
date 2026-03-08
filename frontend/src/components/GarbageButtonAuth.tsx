import { useCallback, useEffect, useRef, useState } from "react";

export default function GarbageButtonAuth() {
  // 認証状態でのゴミ投稿ボタン

  // 投稿ボタンorモーダルの×ボタンがクリックされたかでトグル
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // モーダルが開いたら閉じるボタンにフォーカスを移す
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Escapeで閉じる / Tabキーをダイアログ内に閉じ込める
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="garbage-post-title"
          ref={dialogRef}
        >
          <h2 id="garbage-post-title">ゴミの画像を投稿</h2>
          <label htmlFor="garbage-post">画像を添付</label>
          <input type="file" id="garbage-post" />
          <button
            type="button"
            ref={closeButtonRef}
            aria-label="モーダルを閉じる"
            onClick={close}
          >
            x
          </button>
        </div>
      )}
      <button type="button" aria-label="ゴミ投稿フォームを開く" onClick={() => setIsOpen(true)}>+</button>
    </>
  );
}
