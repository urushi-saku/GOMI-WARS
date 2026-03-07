import { db } from '../lib/firebase-admin'

//Gridデータの型
interface GridData {
  ownerUid?: string
  totalPoint?: number
  users?: Record<string, number>
}

//緯度経度からgridIdとindexを計算
function getGridIndex(lat: number, lng: number) {
  const latIndex = Math.floor(lat * 10)
  const lngIndex = Math.floor(lng * 10)
  return { latIndex, lngIndex, gridId: `grid_${latIndex}_${lngIndex}` }
}


export const updateGrid = async (
  lat: number,
  lng: number,
  userId: string,
  addedPoint: number
) => {
  const { latIndex, lngIndex, gridId } = getGridIndex(lat, lng)
  const gridRef = db.collection('grids').doc(gridId)

  //既存データ取得
  const gridDoc = await gridRef.get()
  const gridData: GridData = gridDoc.exists ? (gridDoc.data() as GridData) : {}

  //usersオブジェクト更新
  const users: Record<string, number> = gridData.users || {}
  users[userId] = (users[userId] || 0) + addedPoint

  // totalPoint はグリッド内全ユーザーの合計
  const totalPoint = Object.values(users).reduce((a, b) => a + b, 0)

  // ownerUid をポイント最大のユーザーに更新
  let ownerUid = gridData.ownerUid || userId
  let maxPoint = users[ownerUid]

  for (const [uid, point] of Object.entries(users)) {
    if (point > maxPoint) {
      maxPoint = point
      ownerUid = uid
    }
  }

  // Firestore に反映
  await gridRef.set(
    { latIndex, lngIndex, ownerUid, totalPoint, users, updatedAt: new Date() },
    { merge: true }
  )

  return { gridId, ownerUid, totalPoint, users }
}