import { Request, Response } from 'express'
import { getGlobalRanking, getUserEntry } from '../services/rankingService'
import type { RankingEntry } from '../services/rankingService'

export interface RankingResponse {
  ranking: RankingEntry[]
  myRank: number | null
  myEntry: RankingEntry | null  // sticky 固定表示用（圏外でも返す）
}

/**
 * GET /api/ranking
 * クエリパラメータ: limit (デフォルト20, 最大100)
 * レスポンス: { ranking, myRank, myEntry }
 */
export const getRanking = async (req: Request, res: Response): Promise<void> => {
  const rawLimit = parseInt(req.query.limit as string, 10)
  const limit = isNaN(rawLimit) ? 20 : Math.min(rawLimit, 100)

  try {
    const ranking = await getGlobalRanking(limit)

    let myRank: number | null = null
    let myEntry: RankingEntry | null = null

    if (req.uid) {
      // まずランキングリスト内に自分がいるか確認（全件スキャンを避ける）
      const inList = ranking.find((e) => e.uid === req.uid)
      if (inList) {
        myRank = inList.rank
        myEntry = inList
      } else {
        // 圏外のとき だけ全件スキャンで順位を取得
        const result = await getUserEntry(req.uid)
        myRank = result.rank
        if (result.rank !== null && result.entry !== null) {
          myEntry = { rank: result.rank, ...result.entry }
        }
      }
    }

    res.status(200).json({ ranking, myRank, myEntry })
  } catch (err: any) {
    console.error('rankingController error:', err)
    res.status(500).json({ error: err.message || 'ランキング取得中にエラーが発生しました' })
  }
}
