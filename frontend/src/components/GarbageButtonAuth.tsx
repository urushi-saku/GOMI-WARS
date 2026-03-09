import { useState } from "react";

export default function GarbageButtonAuth() {
  // 認証状態でのゴミ投稿ボタン

  // 投稿ボタンorモーダルの×ボタンがクリックされたかでトグル
  const [isClicked, setIsClicked] = useState(false);

  // ゴミ投稿用のモーダル
  const modal = (
    <div>
      <h2>ゴミの画像を投稿</h2>
      <label htmlFor="garbage-post">画像を添付</label>
      <input type="file" id="garbage-post" />
      <button onClick={() => setIsClicked(false)}>x</button>
    </div>
  );
  return (
    <>
      {isClicked ? modal : null}
      <button onClick={() => setIsClicked(true)}>+</button>
    </>
  );
}
