import admin from "firebase-admin";
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: "gs://gomi-wars-b6d6f.firebasestorage.app",
    //fire-complete-projectはご自身のプロジェクトIDに変更
  });
}
const db = admin.firestore();
const auth = admin.auth();
const storageBucket = admin.storage().bucket();
export {db, auth, storageBucket};
