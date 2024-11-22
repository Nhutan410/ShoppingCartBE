import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// hàm validate sẽ xài như sau validate(checkSchema({...}))
// và checkSchema sẽ return RunnableValidationChains<ValidationChain>
// nên mình định dạng validate là hàm nhận vào
// object có dạng RunnableValidationChains<ValidationChain>
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // lỗi thằng checkSchema ra để lấy danh sách lỗi
    await validations.run(req) //funct này cũng lấy lỗi từ req giống validationResult
    const errors = validationResult(req) //lập danh sách lỗi trong req

    if (errors.isEmpty()) {
      return next()
    } else {
      const errorObject = errors.mapped()
      const entityError = new EntityError({ errors: {} })
      // duyệt qua các key trong object lỗi
      for (const key in errorObject) {
        // lấy msg trong các key đó
        const { msg } = errorObject[key]
        if (msg instanceof ErrorWithStatus && msg.status != HTTP_STATUS.UNPROCESSABLE_ENTITY) {
          return next(msg)
        }
        entityError.errors[key] = msg
      }
      next(entityError)
    }
  }
}
