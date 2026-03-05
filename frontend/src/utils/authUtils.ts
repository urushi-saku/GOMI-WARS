import {signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithPopup} from "firebase/auth";
import { auth, googleProvider, API_BASE_URL } from "../lib/firebase";


// verifyUserFunction（API呼び出し）
async function connect(idToken: string) {
  const res = await fetch(`${API_BASE_URL}/verifyUserFunction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`verifyUser error: ${res.status}`);
  }

  return res.json();
}


// メールログイン
export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  await connect(idToken); 
  return result.user;
}


// 新規登録
export async function signupWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();


  await connect(idToken); 
  return result.user;
}


// Googleログイン
export async function googleLogin() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  await connect(idToken);
  return result.user;
}