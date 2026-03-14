import { Request, Response } from 'express'
import { FieldValue, GeoPoint } from 'firebase-admin/firestore'
import { assessImage } from '../services/geminiService'
import { db } from '../lib/firebase-admin'
import { addPointForUser } from '../services/pointService'
import { updateGrid, getGridRef } from '../services/gridService'
import crypto from 'crypto'

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
    //画像hash生成
    const imageHash = crypto.createHash('sha256').update(imageBase64).digest('hex')

    //AI評価
    const assessment = await assessImage(imageBase64, mimeType)
    const result = await db.runTransaction(async (transaction) => {

      const pickupRef = db.collection('pickups').doc(imageHash)
      const userRef = db.collection('users').doc(req.uid!)
      const hasLocation = location?.lat !== undefined && location?.lng !== undefined
      const gridRef = hasLocation ? getGridRef(location!.lat, location!.lng) : null

      // === ALL READS FIRST ===
      const existing = await transaction.get(pickupRef)
      const userDoc = await transaction.get(userRef)
      const gridDoc = gridRef ? await transaction.get(gridRef) : null

      if (existing.exists) {
        throw new Error('同じ画像は投稿できません')
      }

      // === ALL WRITES ===
      // is_trash: true かつ is_suspicious: false のときだけ Firestore に保存
      if (assessment.is_trash && !assessment.is_suspicious) {
        const pickupData: Record<string, unknown> = {
          userId: req.uid,
          points: assessment.points,
          comment: assessment.comment,
          imageHash: imageHash,
          createdAt: FieldValue.serverTimestamp(),
        }

        if (hasLocation) {
          pickupData.location = new GeoPoint(location!.lat, location!.lng)
        }
        transaction.set(pickupRef, pickupData)
      }

      //Firestore にユーザーの累積ポイント加算
      const updatedUser = addPointForUser(req.uid!, assessment.points, transaction, userDoc)

      // グリッド更新。位置ごとのポイント集計とランキングを管理
      let gridUpdate = null
      if (hasLocation && gridRef && gridDoc) {
        gridUpdate = updateGrid(location!.lat, location!.lng, req.uid!, assessment.points, transaction, gridDoc)
      }

      return {
        totalPoint: updatedUser?.totalPoint,
        grid: gridUpdate
      }
    })

    //レスポンス返却
    res.status(200).json({
      message: 'ゴミ査定＋ポイント加算完了',
      aiResult: assessment,
      totalPoint: result.totalPoint,
      grid: result.grid,
    })

  } catch (err: any) {
    console.error('assessController error:', err)
    res.status(500).json({ error: err.message || '処理中にエラーが発生しました' })
  }
}
