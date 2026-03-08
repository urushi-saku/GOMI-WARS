import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, googleProvider, db, storage } from "../lib/firebase";

/**
 * メールアドレスとパスワードでログインする
 * Firebase Auth の signInWithEmailAndPassword を使用
 * @param email - ユーザーのメールアドレス
 * @param password - ユーザーのパスワード
 * @returns ログイン後のユーザー情報
 */
export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * メールアドレスとパスワードで新規登録する
 * Firebase Auth の createUserWithEmailAndPassword を使用
 * @param email - 新規ユーザーのメールアドレス
 * @param password - 新規ユーザーのパスワード
 * @returns 新規作成されたユーザー情報
 */
export async function signupWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Googleポップアップでサインイン（ログイン・新規登録共通）
 * Firebase Auth の signInWithPopup を使用して Google OAuth フローを実行
 * @returns Googleでサインインしたユーザー情報と ID トークン
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  console.log(`User: ${result.user.displayName} | ID Token: ${idToken}`);
  return result.user;
}

// 互換性維持のためのエイリアス（将来的に削除予定）
export const googleLogin = signInWithGoogle;

/**
 * Firestoreにユーザードキュメントが存在しない場合のみ作成する
 * Google ログイン時に自動実行される
 * 既に登録済みのユーザーの場合は何も実行しない（べき等性を保証）
 * @param user - Firebase Auth のユーザーオブジェクト
 */
export async function createUserDocIfNotExists(user: User) {
  // Firebase の /users/{userId} ドキュメントへの参照を取得
  const userRef = doc(db, "users", user.uid);
  
  // 既にドキュメントが存在するか確認
  const snap = await getDoc(userRef);
  
  // ドキュメントが存在しない場合のみ作成
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      totalPoints: 0,           // 初期ポイント
      totalPickups: 0,          // ゴミ拾い回数の初期値
      createdAt: serverTimestamp(),    // ドキュメント作成日時
      updatedAt: serverTimestamp(),    // 最後更新日時
    });
  }
}

/**
 * プロフィール初期設定フォーム送信時に呼ぶ
 * 以下の処理を実行:
 * 1. 画像がある場合 → Firebase Storage に画像をアップロード
 * 2. Firebase Auth のプロフィール属性を更新
 * 3. Firestore に新しいユーザードキュメントを保存または上書き
 * @param user - Firebase Auth のユーザーオブジェクト
 * @param displayName - ユーザーが入力した表示名
 * @param photoFile - プロフィール画像ファイル（オプション）
 */
export async function saveInitialProfile(
  user: User,
  displayName: string,
  photoFile?: File | null
) {
  let photoURL = user.photoURL ?? "";

  // プロフィール画像がアップロードされている場合の処理
  if (photoFile) {
    // Firebase Storage の avatars/${uid} フォルダに画像を保存
    const storageRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(storageRef, photoFile);
    // Storage内の画像の公開URL を取得
    photoURL = await getDownloadURL(storageRef);
  }

  // Firebase Auth のプロフィール（displayName と photoURL）を更新
  await updateProfile(user, { displayName, photoURL: photoURL || null });

  // Firestore の /users/{uid} ドキュメントにユーザー情報を保存
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    displayName,              // ユーザーが入力した名前
    photoURL,                 // Storage から取得したアバター画像URL
    totalPoints: 0,           // ポイント集計値の初期値
    totalPickups: 0,          // ゴミ拾い履歴数の初期値
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
