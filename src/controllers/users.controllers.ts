import { NextFunction, Request, Response } from 'express'
import {
  ChangePasswordReqBody,
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyEmailReqQuery,
  VerifyForgotPasswordTokenReqBody
} from '~/models/requests/User.requests'
import usersServices from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enums'
// controller là handle điều phối các dữ liệu vào dúng các service xử lý trích
// xuất dữ liệu với server

// controller là nơi xử lý logic, dữ liệu khi đến tầng này thì phải clean

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body
  // gọi database tạo user từ email và password lưu vào collection users
  // kiểm tra xem email đã có trong database hay chưa ?

  const isEmailExit = await usersServices.checkEmailExist(email)
  if (isEmailExit) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
      message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS
    })
  }
  const result = await usersServices.register(req.body)
  //nếu thành công thì
  res.status(201).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    data: result
  })
}

export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body
  // dùng email và password để tìm user
  const result = await usersServices.login({ email, password })

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result //có ac và rf
  })
}

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body
  // vào đến đây thì nghĩa là 2 token kia là do mình ký ra
  // xem thử là thông tin user_id trong payload của access và
  //    user_id trong payload của refresh có phải là 1 không ?
  const { user_id: user_id_at } = req.decode_authorization as TokenPayload
  const { user_id: user_id_rf } = req.decode_refresh_token as TokenPayload
  // chăn việc nó gửi 2 mã của 2 thằng khác nhau
  if (user_id_at != user_id_rf) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, //401
      message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
    })
  }
  // chặn việc gữi một cái refresh_token cũ và không còn tồn tại trong database nữa
  // vào database tìm xem doccument nào chứa refresh_token này và có phải là user_id đó k

  await usersServices.checkRefreshToken({ user_id: user_id_rf, refresh_token })
  // nếu mà có thì mới xóa khỏi database
  await usersServices.logout(refresh_token)
  // nếu code xuống được đây mượt khong có bug thì
  res.status(HTTP_STATUS.OK).json({
    messages: USERS_MESSAGES.LOGOUT_SUCCESS
  })
}

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, any, VerifyEmailReqQuery>,
  res: Response,
  next: NextFunction
) => {
  //vào tới controller thì nghĩa là email_verify_token đã đc xác thực
  const { email_verify_token } = req.query
  const { user_id } = req.decode_email_verify_token as TokenPayload
  // kiểm tra xem user_id và email_verify_token có tồn tại trong database hay không ?
  const user = await usersServices.checkEmailVerifyToken({ user_id, email_verify_token })
  // kiểm tra xem người dùng có phải là unverify không ?
  if (user.verify == UserVerifyStatus.Verified) {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_VERIFIED
    })
  } else if (user.verify == UserVerifyStatus.Banned) {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_BANNED
    })
  } else {
    // tiến hành verifyEmail
    const result = await usersServices.verifyEmail(user_id)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
      result //ac và rf để ngta đăng nhập luôn
    })
  }
}

export const resendEmailVerifyController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  // Lấy user_id tìm xem user này còn tồn tại không ?
  const { user_id } = req.decode_authorization as TokenPayload
  const user = await usersServices.findUserById(user_id)
  // từ user đó xem thử nó đã verify bị ban hay là chưa verify
  if (user.verify == UserVerifyStatus.Verified) {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_VERIFIED
    })
  } else if (user.verify == UserVerifyStatus.Banned) {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_BANNED
    })
  } else {
    // tiến hành verifyEmail
    await usersServices.resendEmailVerify(user_id)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_TOKEN_SUCCESS
    })
  }
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  // người dùng cung cấp email cho mình
  const { email } = req.body
  // kiểm tra email có tồn tại trong database không ?
  const hasEmail = await usersServices.checkEmailExist(email)
  if (!hasEmail) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  } else {
    //có thì mình tạo token và mình gửi
    await usersServices.forgotPassword(email)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    })
  }
}

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  //FE đã gữi lên forgot_password_token cho mình để xem forgot_password_token này
  //còn hiệu lực
  // vậy thì mình chỉ cần tìm xem forgot_password_token và user_id trong payload
  //còn sỡ hữu không ?
  const { forgot_password_token } = req.body
  const { user_id } = req.decode_forgot_password_token as TokenPayload
  //tìm user và xem thử user đó có forgot_password_token này không
  console.log(user_id)

  const user = await usersServices.findUserById(user_id)
  if (!user) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  //nếu có user thì xem thử forgot_password_token ngta gữi lên có khớp trong user không
  if (user.forgot_password_token !== forgot_password_token) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, //401
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_NOT_MATCH
    })
  }
  //còn lại thì ok
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  //FE đã gữi lên forgot_password_token cho mình để xem forgot_password_token này
  //còn hiệu lực
  // vậy thì mình chỉ cần tìm xem forgot_password_token và user_id trong payload
  //còn sỡ hữu không ?
  const { forgot_password_token, password } = req.body
  const { user_id } = req.decode_forgot_password_token as TokenPayload
  //tìm user và xem thử user đó có forgot_password_token này không
  const user = await usersServices.findUserById(user_id)
  if (!user) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  //nếu có user thì xem thử forgot_password_token ngta gữi lên có khớp trong user không
  if (user.forgot_password_token !== forgot_password_token) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, //401
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_NOT_MATCH
    })
  }
  //cập nhật lại mật khẩu
  await usersServices.resetPassword({ user_id, password })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
  })
}

export const getMeController = async (
  req: Request<ParamsDictionary, any, any>, //
  res: Response,
  next: NextFunction
) => {
  //trong cái access token ng dùng gửi lên thì mình
  //sẽ có decode_authorization => tìm dc user_id => user
  const { user_id } = req.decode_authorization as TokenPayload
  const userInfor = await usersServices.getMe(user_id)
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: userInfor
  })
}
export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response,
  next: NextFunction
) => {
  //muốn ng dùng gửi access_token để mình bt họ là ai
  const { user_id } = req.decode_authorization as TokenPayload
  const user = await usersServices.findUserById(user_id)
  //và họ còn gửi lên rất nhiều ttin muốn update trong body
  if (user.verify !== UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, //401
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_UNVERIFIED
    })
  }
  //tiến hành update bằng tất cả nhg j mà client đã gửi vào body
  const { body } = req
  const userInfor = await usersServices.updateMe({ user_id, payload: body })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.UPDATE_PROFILE_SUCCESS,
    result: userInfor
  })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>, //
  res: Response,
  next: NextFunction
) => {
  // khi người dùng muốn đổi mật khẩu, thì họ phải đăng nhập
  // access_token => user_id
  const { user_id } = req.decode_authorization as TokenPayload
  // old_password để biết họ có sỡ hữu account không
  const { old_password, password } = req.body
  //tìm và tiến hành cập nhật password
  await usersServices.changePassword({
    user_id,
    old_password,
    password
  })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
  })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>, //
  res: Response,
  next: NextFunction
) => {
  //kiểm tra refresh_token còn hiệu lực trên database không
  const { user_id } = req.decode_refresh_token as TokenPayload
  const { refresh_token } = req.body
  await usersServices.checkRefreshToken({ user_id, refresh_token })
  // nếu mà kiểm tra k có gì xảy ra thì mình sẽ tiến hành refresh
  const result = await usersServices.refreshToken({ user_id, refresh_token })
  //ta cần user_id để tìm, và refreshToken để xóa cái mã cũ
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}
