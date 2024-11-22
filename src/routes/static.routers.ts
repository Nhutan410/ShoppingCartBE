import { Router } from 'express'
import { serveImageController, serveVideoController } from '~/controllers/static.controllers'
const staticRouter = Router()

staticRouter.get('/image/:namefile', serveImageController)
staticRouter.get('/video/:namefile', serveVideoController)

// :namefile là param
export default staticRouter
