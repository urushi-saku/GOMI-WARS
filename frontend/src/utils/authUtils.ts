import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

// ログイン
export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// 新規登録
export async function signupWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
// Googleでサインイン（Login/Signup共通で使える）
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  console.log(`User: ${result.user.displayName} | ID Token: ${idToken}`);
  return result.user;
}

// 互換性維持のためのエイリアス（将来的に削除予定）
export const googleLogin = signInWithGoogle;
