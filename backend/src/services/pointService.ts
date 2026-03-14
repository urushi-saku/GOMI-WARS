import { db } from '../lib/firebase-admin'
import { FieldValue, Transaction } from 'firebase-admin/firestore'
import type { DocumentSnapshot } from 'firebase-admin/firestore'

export const addPointForUser = (uid: string, point: number, transaction: Transaction, userDoc: DocumentSnapshot) => {
  const currentPoint = userDoc.data()?.totalPoint ?? 0
  const newPoint = currentPoint + point

  const userRef = db.collection('users').doc(uid)
  transaction.set(userRef, {
    totalPoint: FieldValue.increment(point),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  return { totalPoint: newPoint }
}
