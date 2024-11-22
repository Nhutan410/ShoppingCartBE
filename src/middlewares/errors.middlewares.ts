// file này chưa hàm xử lý lỗi của toàn bộ server
// lỗi của validate trả về sẽ có các dạng sau
//      EntityError {status, message, errors}
//      ErrorWithStatus {status, message}
// lỗi của controller trả về:
//      ErrorWithStatus {status, message}
//      Error bth {message, stack, name}

import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatus } from '~/models/Errors'

// => lỗi từ mọi nơi đỗ về đây chưa chắc có status
export const defaultErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ErrorWithStatus) {
    res.status(error.status).json(omit(error, ['status']))
  } else {
    // còn những lỗi khác thì nó có nhiều thuộc tính mình k biết, nhưng
    // có thể sẽ có stack và k có status
    // chỉnh hết các key trong object về enumerrable true
    Object.getOwnPropertyNames(error).forEach((key) => {
      Object.defineProperty(error, key, { enumerable: true })
    })

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(error, ['stack']))
  }

  // res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(error, ['status']))
}

// export const defaultErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
//   // res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(error, ['status'])) //trong error bỏ status
//   //lỗi của toàn bộ hệ thống sẽ đổ về đây

//   if (error instanceof ErrorWithStatus) {
//     res.status(error.status).json(omit(error, ['status']))
//   } else {
//     //lỗi khác errorWithStatus, nghĩa là lỗi bình thường, lỗi không có status
//     //lỗi có tùm lum thứ stack, name, k có status
//     Object.getOwnPropertyNames(error).forEach((key) => {
//       Object.defineProperty(error, key, { enumerable: true })
//     }) //lấy cái mảng những cái tên của thuộc tính
//     //
//     res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
//       message: error.message,
//       errorInfor: omit(error, ['stack']) //lấy hết thông tin lỗi nhưng cất stack đi
//     })
//   }
// }
