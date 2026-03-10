import { Router } from 'express'
import { verifyToken } from '../middleware/verifyToken'
import { assess } from '../controllers/assessController'
import { setDisplayName } from '../controllers/userController'

export const assessRouter = Router()

// POST /api/assess
// body: { imageBase64: string, mimeType: string }
assessRouter.post('/', verifyToken, assess)


assessRouter.post("/displayName", verifyToken, setDisplayName)