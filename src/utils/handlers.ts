import { Request, Response, NextFunction, RequestHandler } from 'express'
// file này chứa hàm wrapAsync
// wrapAsyns là 1 hàm nhận vào `async request handler`
// `async request handler`: là các handler đang k có try catch next
// wrapAsyns nhận vào `async request handler` này và
// trả về 1 request handler mới
// có cấu trúc try catch next và chạy `async request handler` cũ trong cấu
// trúc đó

export const wrapAsync = <P, T>(func: RequestHandler<P, any, any, T>) => {
  return async (req: Request<P, any, any, T>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
