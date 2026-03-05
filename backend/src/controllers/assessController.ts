import { Request, Response } from 'express'
import { FieldValue, GeoPoint } from 'firebase-admin/firestore'
import { assessImage } from '../services/geminiService'
import { db } from '../lib/firebase-admin'

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
    const assessment = await assessImage(imageBase64, mimeType)

    // is_trash: true かつ is_suspicious: false のときだけ Firestore に保存
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

    res.json(assessment)
  } catch (err) {
    console.error('Gemini API エラー:', err)
    res.status(500).json({ error: 'AI 査定中にエラーが発生しました' })
  }
}
