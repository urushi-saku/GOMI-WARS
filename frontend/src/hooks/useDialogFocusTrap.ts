import { type RefObject, useEffect, useCallback } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * ダイアログのフォーカス管理フック
 * - ダイアログが開いたら最初のフォーカス可能な要素にフォーカスを移動
 * - Tab / Shift+Tab でダイアログ内をループ
 * - Escape でダイアログを閉じ、トリガーボタンにフォーカスを戻す
 */
export function useDialogFocusTrap(
  isOpen: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  onClose: () => void
): void {
  const close = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

    // ダイアログが開いたら最初のフォーカス可能な要素にフォーカスを移動
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: 先頭要素からさらに戻ろうとしたら末尾へ循環
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: 末尾要素からさらに進もうとしたら先頭へ循環
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close, dialogRef]);
}
