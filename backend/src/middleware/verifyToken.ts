import { Request, Response, NextFunction } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// firebase-admin の初期化（二重初期化を防止）
if (!getApps().length) {
  const base64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64

  if (base64) {
    // Render 本番環境: 環境変数に Base64 エンコードされた JSON を設定する方式
    const json = Buffer.from(base64, 'base64').toString('utf-8')
    const serviceAccount = JSON.parse(json)
    initializeApp({ credential: cert(serviceAccount) })
  } else {
    // ローカル: GOOGLE_APPLICATION_CREDENTIALS（JSONファイルのパス）で認証
    initializeApp()
  }
}

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
    const decoded = await getAuth().verifyIdToken(idToken)
    req.uid = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'トークンが無効です' })
  }
}
