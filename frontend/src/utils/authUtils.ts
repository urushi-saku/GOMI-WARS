import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, runTransaction, updateDoc } from "firebase/firestore";
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
 * @returns Googleでサインインしたユーザー情報
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// 互換性維持のためのエイリアス（将来的に削除予定）
export const googleLogin = signInWithGoogle;

/**
 * Firebase Auth のエラーコードをユーザー向けの日本語メッセージに変換する
 * @param error - catch で受け取ったエラーオブジェクト
 * @returns 表示用の日本語エラーメッセージ
 */
export function getAuthErrorMessage(error: unknown): string {
  // Firebase Auth のエラーは code プロパティを持つ
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません。";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      // セキュリティのため、どちらのミスかは開示しない
      return "メールアドレスまたはパスワードが間違っています。";
    case "auth/email-already-in-use":
      return "このメールアドレスはすでに登録されています。";
    case "auth/weak-password":
      return "パスワードは6文字以上で入力してください。";
    case "auth/too-many-requests":
      return "ログイン試行が多すぎます。しばらくしてから再試行してください。";
    case "auth/network-request-failed":
      return "ネットワークエラーが発生しました。接続を確認してください。";
    case "auth/popup-closed-by-user":
      return "Googleサインインがキャンセルされました。";
    default:
      return error instanceof Error ? error.message : "予期しないエラーが発生しました。";
  }
}

/**
 * Firestoreにユーザードキュメントが存在しない場合のみ作成する
 * Google ログイン時に自動実行される
 * 既に登録済みのユーザーの場合は何も実行しない（べき等性を保証）
 *
 * runTransaction を使うことで「読み取り → 条件付き書き込み」をアトミックに実行し、
 * 複数タブや同時ログインによる二重作成のレースコンディションを防ぐ
 * @param user - Firebase Auth のユーザーオブジェクト
 */
export async function createUserDocIfNotExists(user: User) {
  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (transaction) => {
    // トランザクション内で読み取り（他の書き込みと競合しないよう排他制御）
    const snap = await transaction.get(userRef);

    // ドキュメントが存在しない場合のみ作成
    if (!snap.exists()) {
      transaction.set(userRef, {
        uid: user.uid,
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        totalPoints: 0,           // 初期ポイント
        totalPickups: 0,          // ゴミ拾い回数の初期値
        createdAt: serverTimestamp(),    // ドキュメント作成日時
        updatedAt: serverTimestamp(),    // 最後更新日時
      });
    }
  });
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

  const userRef = doc(db, "users", user.uid);

  // runTransaction で「読み取り → 書き込み」をアトミックに実行
  // 既存ドキュメントを読んでから値を上書きすることで、
  // totalPoints / totalPickups / createdAt などの既存値を確実に保持する
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    const existing = snap.exists() ? snap.data() : null;

    transaction.set(userRef, {
      uid: user.uid,
      displayName,                        // ユーザーが入力した名前
      photoURL,                           // Storage から取得したアバター画像URL
      totalPoints:  existing?.totalPoints  ?? 0,  // 既存ポイントを保持（初回は0）
      totalPickups: existing?.totalPickups ?? 0,  // 既存回数を保持（初回は0）
      createdAt: existing?.createdAt ?? serverTimestamp(), // 初回のみ設定
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * プロフィール画面からユーザー名を更新する
 * Firebase Auth の displayName と Firestore の両方を更新する
 * @param user - Firebase Auth のユーザーオブジェクト
 * @param displayName - 新しいユーザー名
 */
export async function updateDisplayName(user: User, displayName: string) {
  // Firebase Auth のプロフィールを更新
  await updateProfile(user, { displayName });

  // Firestore のドキュメントも更新
  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    displayName,
    updatedAt: serverTimestamp(),
  });
}
