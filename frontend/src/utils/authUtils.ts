import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

// ログイン
export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  console.log(`User: ${result.user.email} | ID Token: ${idToken}`);
  return result.user;
}

// 新規登録
export async function signupWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  console.log(`User: ${result.user.email} | ID Token: ${idToken}`);
  return result.user;
}

// Googleログイン（Login/Signup共通で使える）
export async function googleLogin() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  console.log(`User: ${result.user.displayName} | ID Token: ${idToken}`);
  return result.user;
}
