import express from 'express'
import {
  changePasswordController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  changePasswordValidator,
  forgotPasswordTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifyEmailTokenValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
// tạo route
const userRouter = express.Router()

// chức năng đăng ký tài khoản register {email password}
// users/register req.body{email và password}

/*
Description: Register a new user
Path: users/register
method: POST
Body:{
    name: string,
    email: string,
    password: string,
    confirm_password: string
    date_of_birth: ISO8601
}
*/
userRouter.post('/register', registerValidator, wrapAsync(registerController))

/*
desc: Login
path: users/login
method: POST
body: {
    email: string,
    password: string
}
*/
userRouter.post('/login', loginValidator, wrapAsync(loginController))

/*
desc: logout
path: users/logout
method: post
header: {Authorization: Bearer <access_token>}
body: {
    refresh_token: string
}
*/
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
decs: verify-email: khi người dùng vào email và bấm vào link để verify email
họ sẽ gửi email_verify_token lên cho mình thông qua query
path: users/verify-email/?email_verify_token=string
method: get
*/
userRouter.get('/verify-email/', verifyEmailTokenValidator, wrapAsync(verifyEmailController))

/*
decs: Resend Email Verify
path: users/resend-verify-email
chức năng này cần đăng nhập để sử dụng
method: Post
headers: {
    Authorization: 'Bearer <access_token>'
}
*/
userRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/*
desc: forgot-password
khi mà ta bị quên mật khẩu thì ta sẽ k đăng nhập được
thứ duy nhất mà ta có thể cung cấp cho server là email
path: users/forgot-password
method: post
body: {
    email: string
}
*/
userRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
desc: Verify link in email to reset password
path: /verify-forgot-password-token
method: post
body: {
    forgot_password_token: string
}
*/
userRouter.post('/verify-forgot-password', forgotPasswordTokenValidator, wrapAsync(verifyForgotPasswordTokenController))

/*
desc: reset password
path: reset-password
method: post
body: {
  password: string,
  confirmed_password: string
  forgot_password_token: string
}
*/
userRouter.post(
  '/reset-password', //
  forgotPasswordTokenValidator,
  resetPasswordValidator, // kiểm tra password, confirm_pasword, forgot_password_token
  wrapAsync(resetPasswordController)
)

/*
des: get profile của user
path: '/me'
method: post
Header: {Authorization: Bearer <access_token>}
body: {}
*/
userRouter.post('/me', accessTokenValidator, wrapAsync(getMeController))

/*
des: update profile của user
path: '/me'
method: patch
Header: {Authorization: Bearer <access_token>}
body: {
  name?: string
  date_of_birth?: Date
  bio?: string // optional
  location?: string // optional
  website?: string // optional
  username?: string // optional
  avatar?: string // optional
  cover_photo?: string // optional}
*/

userRouter.patch(
  '/me',
  //cần 1 middlewere lọc ra những gì cần lấy trong body
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
  ]),
  accessTokenValidator, // kiểm tra access_token và biết ai muốn cập nhật
  updateMeValidator, // kiểm tra các field mà người dùng muốn cập nhật có hợp lệ không
  wrapAsync(updateMeController) //tiến hành cập nhật
)

/*desc: change-password
chức năng đổi mật khẩu
path: users/change-password
mothod: put
headers: {
  Authorization: 'Bearer <access_token>'
}
body: {
  old_password: string
  password: string
  confirm_password: string
}
*/
userRouter.put('/change-password', accessTokenValidator, changePasswordValidator, wrapAsync(changePasswordController))

/*desc: refresh_token
path: users/refresh-token
method: post
body: {
  refresh_token: string
}
*/
userRouter.post('/refresh-token', refreshTokenValidator, wrapAsync(refreshTokenController))

export default userRouter
