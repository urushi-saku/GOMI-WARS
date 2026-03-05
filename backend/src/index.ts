import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { assessRouter } from './routes/assess'

const app = express()
const PORT = process.env.PORT ?? 3001

// CORS: フロントエンドのオリジンのみ許可
const allowedOrigins = [
  'http://localhost:5173',            // Vite 開発サーバー
  process.env.FRONTEND_URL ?? '',     // 本番フロントエンド URL
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Origin なし（curl など）または許可リストにあれば OK
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: ${origin} は許可されていません`))
      }
    },
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' })) // 画像 Base64 を受け取るため大きめに設定

// ルート
app.use('/api/assess', assessRouter)

// ヘルスチェック（Render がサーバーの起動を確認するために使う）
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 GOMI-WARS API server running on port ${PORT}`)
})
