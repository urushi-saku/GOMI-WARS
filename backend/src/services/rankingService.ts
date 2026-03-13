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
 */
export const getUserEntry = async (uid: string): Promise<{ rank: number | null; entry: Omit<RankingEntry, 'rank'> | null }> => {
  const snapshot = await db
    .collection('users')
    .orderBy('totalPoint', 'desc')
    .orderBy('updatedAt', 'asc')  // getGlobalRanking と同じ並び順で順位を確定
    .get()

  const index = snapshot.docs.findIndex((doc) => doc.id === uid)
  if (index === -1) return { rank: null, entry: null }

  const data = snapshot.docs[index].data()
  return {
    rank: index + 1,
    entry: {
      uid,
      displayName: toDisplayName(data.displayName),
      photoURL: (data.photoURL as string | undefined) ?? null,
      totalPoint: (data.totalPoint as number | undefined) ?? 0,
    },
  }
}
