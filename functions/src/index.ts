import * as functions from 'firebase-functions/v2'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { verifyUser } from "./controllers/authController"; 

//検証
export const verifyUserFunction = functions.https.onRequest(
  async (req, res) => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    if (!idToken) {
      res.status(401).send("Unauthorized");
      return;
    }

    try {
      const decodedToken = await verifyUser(idToken);
      res.status(200).json(decodedToken);
    } catch (error) {
      res.status(401).send("Invalid token");
    }
  }
);

// 環境変数から Gemini API キーを取得（Cloud Functions のシークレットで管理）
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY が設定されていません')
  return new GoogleGenerativeAI(apiKey)
}

/**
 * ゴミ画像を Gemini Flash で査定し、ポイントとコメントを返す
 * リクエスト: { imageBase64: string, mimeType: string, lat?: number, lng?: number }
 * レスポンス: { point: number, category: string, comment: string, itemName: string }
 */
export const assessGarbage = functions.https.onCall(
  {
    region: 'asia-northeast1',
    secrets: ['GEMINI_API_KEY'],
  },
  async (request) => {
    // 認証チェック
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です')
    }

    const { imageBase64, mimeType } = request.data as {
      imageBase64: string
      mimeType: string
      lat?: number
      lng?: number
    }

    if (!imageBase64 || !mimeType) {
      throw new functions.https.HttpsError('invalid-argument', '画像データが必要です')
    }

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `
あなたはゴミ拾いゲーム「GOMI-WARS」の査定AIです。
送られてきた画像を見て、拾われたゴミを査定してください。

以下のJSON形式のみで回答してください（他のテキストは不要）：
{
  "itemName": "ゴミの名前（例：ペットボトル、タバコの吸い殻）",
  "category": "カテゴリ（plastic/cigarette/paper/can/glass/other のいずれか）",
  "point": 10から100の間の整数（レア度・危険度・清掃の難易度で決定）,
  "comment": "査定コメント（ユーモアを交えた30文字以内の日本語）"
}
`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        },
      },
    ])

    const text = result.response.text().trim()

    // JSON 部分だけ抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new functions.https.HttpsError('internal', 'AI の応答が不正です')
    }

    const assessment = JSON.parse(jsonMatch[0]) as {
      itemName: string
      category: string
      point: number
      comment: string
    }

    return assessment
  }
)
