import { Router } from 'express'
import { verifyToken } from '../middleware/verifyToken'
import { assess } from '../controllers/assessController'

export const assessRouter = Router()

// POST /api/assess
// body: { imageBase64: string, mimeType: string }
assessRouter.post('/', verifyToken, assess)
