import { useState } from "react";
import { Link } from "react-router-dom";

export default function GarbageButton() {
  // 未認証状態でのゴミ投稿ボタン

  // 投稿ボタンorモーダルの×ボタンがクリックされたかでトグル
  const [isClicked, setIsClicked] = useState(false);

  // ログインを促すモーダル
  const modal = (
    <div>
      <Link to="/login">ログインする</Link>
      <button type="button" aria-label="モーダルを閉じる" onClick={() => setIsClicked(false)}>X</button>
    </div>
  );
  return (
    <>
      {isClicked ? modal : null}
      <button type="button" aria-label="ゴミ投稿フォームを開く" onClick={() => setIsClicked(true)}>+</button>
    </>
  );
}
