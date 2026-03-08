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
      <button onClick={() => setIsClicked(false)}>X</button>
    </div>
  );
  return (
    <>
      {isClicked ? modal : null}
      <button onClick={() => setIsClicked(true)}>+</button>
    </>
  );
}
