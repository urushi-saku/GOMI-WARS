import * as functions from 'firebase-functions/v2'
import * as admin from 'firebase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

admin.initializeApp()

// 環境変数から Gemini API キーを取得（Cloud Functions のシークレットで管理）
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY が設定されていません')
  return new GoogleGenerativeAI(apiKey)
}

/**
 * ゴミ画像を Gemini Flash で査定し、ポイントとコメントを返す
 * リクエスト: { imageBase64: string, mimeType: string }
 * レスポンス: { is_trash: boolean, type: string, material: string, points: number, comment: string, is_suspicious?: boolean }
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
    }

    if (!imageBase64 || !mimeType) {
      throw new functions.https.HttpsError('invalid-argument', '画像データが必要です')
    }

    const genAI = getGeminiClient()

    // システムプロンプト（AI が守るべき「憲法」）
    const systemInstruction = `あなたは「GOMI-WARS」の専属査定官です。送られた画像に写っているゴミを分析し、必ず以下のJSON形式でのみ回答してください。余計な文章や解説は一切含めないでください。

{
  "is_trash": true,
  "type": "ゴミの種類（例：ペットボトル、空き缶、タバコの吸い殻）",
  "material": "素材（例：プラスチック、アルミ、紙）",
  "points": 1〜100の数値（分別の難しさと環境負荷で算出）,
  "comment": "ユーザーへの一言（観測者らしい知的なコメント）",
  "is_suspicious": false
}
必ず { から始めて、 } で終わってください。JSON以外の文字は1文字も出力しないでください。
液体の内容物が確認できるものや、明らかに生活必需品として機能しているものは is_trash: false と判定せよ。

判定に迷った際は、その物体の「有用性（Utility）」を最優先に考慮せよ。
【不正検知（is_suspicious）のルール】
以下のいずれかに該当する場合、is_suspiciousを true にし、pointsを 0 とせよ。
1. 画像が「画面の直撮り（PCやスマホのモニターを撮ったもの）」であると判断した場合。
2. 画像が「印刷物（写真や雑誌）を再撮影したもの」であると判断した場合。
3. 明らかに合成写真や、実世界の3次元的奥行きを欠く不自然な画像である場合。

【メッセージの指針】
is_suspiciousが true の場合、観測者として「欺瞞を見抜いた」という冷徹な、あるいは皮肉めいたコメントを出力せよ。`

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        },
      },
    ])

    const text = result.response.text().trim()

    // responseMimeType: 'application/json' に設定しているので、AI は必ず JSON を返す
    const assessment = JSON.parse(text) as {
      is_trash: boolean
      type: string
      material: string
      points: number
      comment: string
      is_suspicious?: boolean
    }

    // is_suspicious が true の場合はポイント0
    if (assessment.is_suspicious) {
      assessment.points = 0
    }

    return assessment
  }
)