import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import mediasServices from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const infor = await mediasServices.handleUploadImage(req)
  res.json({
    message: 'Upload image successfully',
    infor
  })
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const infor = await mediasServices.handleUploadVideo(req)
  res.status(HTTP_STATUS.OK).json({
    message: 'Upload video successfully',
    infor
  })
}
