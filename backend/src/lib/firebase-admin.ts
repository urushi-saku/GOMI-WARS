import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Firebase Admin の初期化（二重初期化を防止）
if (!getApps().length) {
  const base64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64

  if (base64) {
    // Render 本番環境: 環境変数に Base64 エンコードされた JSON を設定する方式
    const json = Buffer.from(base64, 'base64').toString('utf-8')
    const serviceAccount = JSON.parse(json)
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'gs://gomi-wars-b6d6f.firebasestorage.app',
    })
  } else {
    // ローカル: GOOGLE_APPLICATION_CREDENTIALS（JSONファイルのパス）で認証
    initializeApp({
      storageBucket: 'gs://gomi-wars-b6d6f.firebasestorage.app',
    })
  }
}

export const auth = getAuth()
export const db = getFirestore()
export const storageBucket = getStorage().bucket()
