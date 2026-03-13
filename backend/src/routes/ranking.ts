import { Router } from 'express'
import { optionalVerifyToken } from '../middleware/verifyToken'
import { getRanking } from '../controllers/rankingController'

export const rankingRouter = Router()

// GET /api/ranking?limit=20
// 未ログインでもランキングは閲覧可能（ログイン済みの場合は myRank も返す）
rankingRouter.get('/', optionalVerifyToken, getRanking)
