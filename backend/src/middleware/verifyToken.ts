import { Request, Response, NextFunction } from 'express'
import { auth } from '../lib/firebase-admin'

// Express の Request に uid を追加する型拡張
declare global {
  namespace Express {
    interface Request {
      uid?: string
    }
  }
}

/**
 * Authorization: Bearer <Firebase IDトークン> を検証するミドルウェア
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'ログインが必要です' })
    return
  }

  const idToken = authHeader.split('Bearer ')[1]

  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.uid = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'トークンが無効です' })
  }
}
