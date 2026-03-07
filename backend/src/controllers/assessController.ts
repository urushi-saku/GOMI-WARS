import { Request, Response } from 'express'
import { FieldValue, GeoPoint } from 'firebase-admin/firestore'
import { assessImage } from '../services/geminiService'
import { db } from '../lib/firebase-admin'
import { addPointForUser } from '../services/pointService'
import { updateGrid } from '../services/gridService'

export const assess = async (req: Request, res: Response): Promise<void> => {
  const { imageBase64, mimeType, location } = req.body as {
    imageBase64?: string
    mimeType?: string
    location?: { lat: number; lng: number }
  }

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: '画像データ（imageBase64, mimeType）が必要です' })
    return
  }

  try {
    //AI評価
    const assessment = await assessImage(imageBase64, mimeType)

    // is_trash: true かつ is_suspicious: false のときだけ Firestore に保存
    //AI評価結果の履歴をユーザーごとに保存
    if (assessment.is_trash && !assessment.is_suspicious) {
      const pickupData: Record<string, unknown> = {
        userId: req.uid,
        points: assessment.points,
        comment: assessment.comment,
        createdAt: FieldValue.serverTimestamp(),
      }

      if (location?.lat !== undefined && location?.lng !== undefined) {
        pickupData.location = new GeoPoint(location.lat, location.lng)
      }

      
      await db.collection('pickups').add(pickupData)
    }

    //Firestore にユーザーの累積ポイント加算
    const updatedUser = await addPointForUser(req.uid!, assessment.points)

    // グリッド更新。位置ごとのポイント集計とランキングを管理
    let gridUpdate = null
    if (location?.lat !== undefined && location?.lng !== undefined) {
      gridUpdate = await updateGrid(location.lat, location.lng, req.uid!, assessment.points)
    }

    //レスポンス返却
    res.status(200).json({
      message: 'ゴミ査定＋ポイント加算完了',
      aiResult: assessment,
      totalPoint: updatedUser?.totalPoint,
      grid: gridUpdate,
    })

  } catch (err:any) {
    console.error('assessController error:', err)
    res.status(500).json({ error: err.message || '処理中にエラーが発生しました'})
  }
}
