import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, runTransaction, updateDoc, deleteField } from "firebase/firestore";
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
  // onAuthStateChanged 直後は ID トークンが Firestore クライアントに
  // まだ渡っていない場合がある。getIdToken() で明示的に取得してから
  // Firestore リクエストを発行することで race condition を回避する
  await user.getIdToken();

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
        totalPoint: 0,            // バックエンドが increment するフィールド名に統一
        totalPickups: 0,          // ゴミ拾い回数の初期値
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * プロフィール初期設定フォーム送信時に呼ぶ
 * 以下の処理を実行:
 * 1. 画像がある場合 → Firebase Storage に画像をアップロード
 * 2. Firebase Auth のプロフィール属性を更新
 * 3. Firestore のユーザードキュメントを更新（新規の場合は作成）
 *
 * 既存ドキュメントには displayName / photoURL / updatedAt のみ書き込み、
 * email / role / totalPoint など他フィールドは一切触らない。
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

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);

    // プロフィール更新で常に書くフィールドのみ定義
    const profileFields = {
      displayName,
      photoURL,
      updatedAt: serverTimestamp(),
    };

    if (snap.exists()) {
      // 既存ドキュメント: プロフィール関連フィールドのみ更新
      // → email / role / totalPoint / createdAt など全フィールドを維持
      const data = snap.data();
      const updateFields: Record<string, unknown> = { ...profileFields };

      // 旧フィールド totalPoints (複数形) → totalPoint (単数形) への移行
      // totalPoints のみ存在し totalPoint が未設定の場合に限り一度だけ実行
      if (data["totalPoints"] !== undefined && data["totalPoint"] === undefined) {
        updateFields["totalPoint"] = data["totalPoints"];
        updateFields["totalPoints"] = deleteField();
      }

      transaction.update(userRef, updateFields);
    } else {
      // 新規ドキュメント: 初期値もまとめてセット
      transaction.set(userRef, {
        uid: user.uid,
        ...profileFields,
        totalPoint: 0,
        totalPickups: 0,
        createdAt: serverTimestamp(),
      });
    }
  });
}

/**
 * プロフィール画面からユーザー名を更新する
 * Firebase Auth と Firestore の displayName を両方更新する。
 *
 * 更新順序: Firestore → Firebase Auth
 * Firestore を先に更新し、Auth 更新が失敗した場合に Firestore を元の値に
 * ロールバックすることで、両者の不整合を防ぐ。
 *
 * @param user - Firebase Auth のユーザーオブジェクト
 * @param displayName - 新しいユーザー名
 */
export async function updateDisplayName(user: User, displayName: string) {
  const previousDisplayName = user.displayName ?? "";
  const userRef = doc(db, "users", user.uid);

  // 1. Firestore を先に更新
  await updateDoc(userRef, {
    displayName,
    updatedAt: serverTimestamp(),
  });

  // 2. Firebase Auth を更新。失敗時は Firestore をロールバックして不整合を回避
  try {
    await updateProfile(user, { displayName });
  } catch (authError) {
    // Auth 更新失敗 → Firestore を元の値に戻す
    await updateDoc(userRef, {
      displayName: previousDisplayName,
      updatedAt: serverTimestamp(),
    }).catch(() => {
      // ロールバック自体も失敗した場合は上位に任せて握りつぶさない
    });
    throw authError;
  }
}
