import { db } from '../lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const addPointForUser = async (uid: string, point: number) => {
　// Firestoreにユーザーの累積ポイント加算
  const userRef = db.collection('users').doc(uid)

  await userRef.update({ totalPoint: FieldValue.increment(point) })

  const updatedUserDoc = await userRef.get()
  return updatedUserDoc.data()
}