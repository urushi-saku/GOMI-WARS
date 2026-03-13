import { db } from '../lib/firebase-admin'
import { FieldValue,Transaction } from 'firebase-admin/firestore'
import { User } from '../types'

export const addPointForUser = async (uid: string, point: number, transaction:Transaction)=> {
　// Firestoreにユーザーの累積ポイント加算
  const userRef = db.collection('users').doc(uid)
  const userDoc = await transaction.get(userRef)

  const userData = userDoc.data() as User | undefined
  const currentPoint = userData?.totalPoint ?? 0
  const newPoint = currentPoint + point
  
  transaction.set(userRef,
  { totalPoint: FieldValue.increment(point) },
  { merge: true }
)
  return { totalPoint: newPoint }
}