import { Request, Response } from 'express'
import { db } from '../lib/firebase-admin'


export const setDisplayName = async (req: Request, res: Response) => {
  try {
    const uid = req.uid
    if (!uid) return res.status(401).json({ error: 'ログインが必要です' })

    const { displayName } = req.body
    if (!displayName || displayName.trim() === '') {
      return res.status(400).json({ error: 'ユーザー名を入力してください' })
    }

    // displayName重複チェック
    const check = await db.collection('users').where('displayName', '==', displayName).limit(1).get()

    if (!check.empty) {
      return res.status(400).json({ error: 'このユーザー名は既に使われています' })
    }

    // 更新
    await db.collection('users').doc(uid).update({
      displayName
    })

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}