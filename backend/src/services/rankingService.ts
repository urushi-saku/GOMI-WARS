import { db } from '../lib/firebase-admin'

export interface RankingEntry {
  rank: number
  uid: string
  displayName: string
  photoURL: string | null
  totalPoint: number
}

/** 空文字・空白のみの場合もデフォルト名にフォールバック */
const toDisplayName = (raw: unknown): string =>
  (typeof raw === 'string' ? raw.trim() : '') || '名無しさん'

/**
 * totalPoint の降順で上位 limit 件のユーザーランキングを返す
 */
export const getGlobalRanking = async (limit = 20): Promise<RankingEntry[]> => {
  const snapshot = await db
    .collection('users')
    .orderBy('totalPoint', 'desc')
    .orderBy('updatedAt', 'asc')  // 同点の場合は先に到達した人を上位に
    .select('displayName', 'photoURL', 'totalPoint')  // 表示に必要なフィールドのみ取得
    .limit(limit)
    .get()

  return snapshot.docs.map((doc, index) => {
    const data = doc.data()
    return {
      rank: index + 1,
      uid: doc.id,
      displayName: toDisplayName(data.displayName),
      photoURL: (data.photoURL as string | undefined) ?? null,
      totalPoint: (data.totalPoint as number | undefined) ?? 0,
    }
  })
}

/**
 * 指定ユーザーの順位とエントリ情報を返す
 * ranking に含まれない圏外ユーザーの sticky 固定表示に使用
 *
 * 全件スキャンを避けるため count() 集計クエリで順位を算出する:
 *   rank = (totalPoint が自分より多いユーザー数)
 *        + (totalPoint が同点かつ updatedAt が自分より早いユーザー数)
 *        + 1
 */
export const getUserEntry = async (uid: string): Promise<{ rank: number | null; entry: Omit<RankingEntry, 'rank'> | null }> => {
  // 1. 対象ユーザーのドキュメントを直接取得（必要フィールドのみ）
  const [userDoc] = await db.getAll(
    db.collection('users').doc(uid),
    { fieldMask: ['displayName', 'photoURL', 'totalPoint', 'updatedAt'] },
  )
  if (!userDoc.exists) return { rank: null, entry: null }

  const data = userDoc.data()!
  const myTotalPoint: number = (data.totalPoint as number | undefined) ?? 0
  const myUpdatedAt = data.updatedAt  // Firestore Timestamp

  // 2. 自分より上位のユーザー数を count() で集計（ドキュメント本体を取得しない）
  const [aboveSnap, samePointEarlierSnap] = await Promise.all([
    // totalPoint が自分より多い → 確実に上位
    db.collection('users')
      .where('totalPoint', '>', myTotalPoint)
      .count()
      .get(),
    // 同点かつ updatedAt が早い（先に到達した）→ 同点内で上位
    db.collection('users')
      .where('totalPoint', '==', myTotalPoint)
      .where('updatedAt', '<', myUpdatedAt)
      .count()
      .get(),
  ])

  const rank = aboveSnap.data().count + samePointEarlierSnap.data().count + 1

  return {
    rank,
    entry: {
      uid,
      displayName: toDisplayName(data.displayName),
      photoURL: (data.photoURL as string | undefined) ?? null,
      totalPoint: myTotalPoint,
    },
  }
}
