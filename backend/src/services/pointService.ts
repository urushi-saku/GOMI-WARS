import { db } from '../lib/firebase-admin'
import { FieldValue,Transaction } from 'firebase-admin/firestore'

export const addPointForUser = async (uid: string, point: number, transaction:Transaction)=> {
　// Firestoreにユーザーの累積ポイント加算
  const userRef = db.collection('users').doc(uid)
  const userDoc = await transaction.get(userRef)

  const currentPoint = userDoc.data()?.totalPoint ?? 0
  const newPoint = currentPoint + point
  
  transaction.set(userRef,
  {
    totalPoint: FieldValue.increment(point),
    updatedAt: FieldValue.serverTimestamp(),  // 同点時の先着順ソート用
  },
  { merge: true }
)
  return { totalPoint: newPoint }
}