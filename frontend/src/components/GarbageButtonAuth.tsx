import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { auth, db, storage } from "../lib/firebase";
import type { GarbageCategory } from "../types";

export default function GarbageButtonAuth() {
  // 認証状態でのゴミ投稿ボタン

  // 投稿ボタンorモーダルの×ボタンがクリックされたかでトグル
  const [isOpen, setIsOpen] = useState(false);
  // 選択された画像ファイル
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // ゴミのカテゴリ
  const [category, setCategory] = useState<GarbageCategory>("other");
  // コメント
  const [comment, setComment] = useState("");
  // アップロード中フラグ
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setCategory("other");
    setComment("");
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !selectedFile) return;

    setIsUploading(true);
    try {
      // Firebase Storage に画像をアップロード
      const storageRef = ref(
        storage,
        `pickups/${user.uid}/${Date.now()}_${selectedFile.name}`,
      );
      await uploadBytes(storageRef, selectedFile);
      const imageURL = await getDownloadURL(storageRef);

      // Firestore にゴミ拾い記録を保存
      // TODO: itemName と point は将来的に Gemini AI の査定結果で上書きする
      await addDoc(collection(db, "pickups"), {
        userId: user.uid,
        userDisplayName: user.displayName ?? "",
        itemName: "",
        category,
        point: 0,
        comment,
        imageURL,
        createdAt: Timestamp.now(),
      });

      handleClose();
    } catch (error) {
      console.error("投稿に失敗しました:", error);
      window.alert("投稿に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsUploading(false);
    }
  };

  // ゴミ投稿用のモーダル
  const modal = (
    <div>
      <h2>ゴミの画像を投稿</h2>
      <label htmlFor="garbage-post">画像を添付</label>
      <input
        type="file"
        id="garbage-post"
        accept="image/*"
        onChange={handleFileChange}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as GarbageCategory)}
      >
        <option value="plastic">プラスチック</option>
        <option value="cigarette">タバコ</option>
        <option value="paper">紙</option>
        <option value="can">缶</option>
        <option value="glass">ガラス</option>
        <option value="other">その他</option>
      </select>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="コメント"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedFile || isUploading}
      >
        {isUploading ? "投稿中..." : "投稿する"}
      </button>
      <button type="button" aria-label="モーダルを閉じる" onClick={handleClose}>
        x
      </button>
    </div>
  );

  return (
    <>
      {isOpen ? modal : null}
      <button
        type="button"
        aria-label="ゴミ投稿フォームを開く"
        onClick={() => setIsOpen(true)}
      >
        +
      </button>
    </>
  );
}
