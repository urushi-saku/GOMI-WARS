import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

// ログイン
export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const idToken = await user.getIdToken();

  await fetch("https://gomi-wars-b6d6f.firebaseapp.com/verifyUserFunction", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  return user;
}

// 新規登録
export async function signupWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const idToken = await user.getIdToken();

  await fetch("https://gomi-wars-b6d6f.firebaseapp.com/verifyUserFunction", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  return user;
}

// Googleでサインイン（Login/Signup共通で使える）
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await result.user.getIdToken();

  await fetch("https://gomi-wars-b6d6f.firebaseapp.com/verifyUserFunction", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  return user;
}

// 互換性維持のためのエイリアス（将来的に削除予定）
export const googleLogin = signInWithGoogle;
