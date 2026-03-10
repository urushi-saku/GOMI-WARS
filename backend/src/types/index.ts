import { Timestamp } from 'firebase-admin/firestore'

export interface AssessmentResult {
  is_trash: boolean
  is_suspicious: boolean
  type: string
  material: string
  points: number
  comment: string
}
                    

export interface User {
  uid: string
  email?: string
  createdAt: Timestamp 
  role: 'user' | 'admin'
  totalPoint: number
}


export interface GridData {
  latIndex: number
  lngIndex: number
  ownerUid: string      // このグリッドの支配者
  totalPoint: number    // グリッド内全員の合計ポイント
  users: Record<string, number> // { uid: points }
  updatedAt: Date
}


export interface GridResponse {
  gridId: string  //位置をグリッドにしたもの
  ownerUid: string  // このグリッドの支配者のuid
  totalPoint: number// グリッド内全員の合計ポイント
  users: Record<string, number>// { uid: points }
}