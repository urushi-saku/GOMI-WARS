import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Firebase Admin の初期化（二重初期化を防止）
if (!getApps().length) {
  const base64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64

  try {
    if (base64) {
      // Render 本番環境: 環境変数に Base64 エンコードされた JSON を設定する方式
      const json = Buffer.from(base64, 'base64').toString('utf-8')
      const serviceAccount = JSON.parse(json)
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: 'gs://gomi-wars-b6d6f.firebasestorage.app',
      })
      console.log('[Firebase Admin] Base64 credentials で初期化完了')
    } else {
      // ローカル: GOOGLE_APPLICATION_CREDENTIALS（JSONファイルのパス）で認証
      initializeApp({
        storageBucket: 'gs://gomi-wars-b6d6f.firebasestorage.app',
      })
      console.log('[Firebase Admin] ADC で初期化完了')
    }
  } catch (err) {
    console.error('[Firebase Admin] 初期化エラー:', err)
    process.exit(1)
  }
}

export const auth = getAuth()
export const db = getFirestore()
export const storageBucket = getStorage().bucket()
