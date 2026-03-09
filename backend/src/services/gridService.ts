import { db } from '../lib/firebase-admin'
import type { GridData, GridResponse } from '../types'
import { Transaction } from 'firebase-admin/firestore'

//緯度経度からgridIdとindexを計算(緯度0.1×経度0.1 の四角形)。*デモは(緯度0.01×経度0.01 の四角形)
function getGridIndex(lat: number, lng: number) {
  const latIndex = Math.floor(lat * 10)
  const lngIndex = Math.floor(lng * 10)
  return { latIndex, lngIndex, gridId: `grid_${latIndex}_${lngIndex}` }
}


export const updateGrid = async (
  lat: number,
  lng: number,
  userId: string,
  addedPoint: number,
  transaction: Transaction
) : Promise<GridResponse> => {
  const { latIndex, lngIndex, gridId } = getGridIndex(lat, lng)
  const gridRef = db.collection('grids').doc(gridId)


    //既存データ取得
    const gridDoc = await transaction.get(gridRef)
    const gridData: GridData = gridDoc.exists
      ? (gridDoc.data() as GridData)
      : {
          latIndex,
          lngIndex,
          ownerUid: userId,
          totalPoint: 0,
          users: {},
          updatedAt: new Date(),
        }
 
  //usersオブジェクト更新
  const users: Record<string, number> = gridData.users || {}
  users[userId] = (users[userId] || 0) + addedPoint

  // totalPoint はグリッド内全ユーザーの合計
  const totalPoint = Object.values(users).reduce((a, b) => a + b, 0)

  // ownerUid をポイント最大のユーザーに更新
  let ownerUid = gridData.ownerUid || userId
  let maxPoint = users[ownerUid] ||0

  for (const [uid, point] of Object.entries(users)) {
    if (point > maxPoint) {
      maxPoint = point
      ownerUid = uid
    }
  }

  // Firestore に反映
  const updatedGrid: GridData = {latIndex,lngIndex,ownerUid,totalPoint,users,updatedAt: new Date(),}

  
  transaction.set(gridRef, updatedGrid, { merge: true })

  // フロントに返す形式に整形
  const response: GridResponse = {gridId,ownerUid,totalPoint,users,}
  return response
}