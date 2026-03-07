import { auth, db } from '../lib/firebase-admin'
import { User } from '../types'

export async function verifyUser(idToken: string) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken)

    // Firestoreからユーザーを取得
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()

    if (!userDoc.exists) {
      // 初回ログイン → 新規作成
      
      const newUser: User = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      createdAt: new Date(),
      role: 'user',
      totalPoint: 0
      }
      await db.collection('users').doc(decodedToken.uid).set(newUser)
      console.info(`${decodedToken.uid} さんのデータを追加しました`)
    }

    return decodedToken // uidやemailが入っている。この人はだれかを特定。
  } catch (error) {
    console.error('Invalid or expired token', error)
    //db.collection("users").add(user);でエラーが発生した場合の処理
    throw new Error('Error creating user:') //エラー時のログ
  }
}
