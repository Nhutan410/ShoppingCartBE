import User from '~/models/schemas/User.schema'
import databaseServices from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { signToken } from '~/utils/jwt'
import dotenv from 'dotenv'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
dotenv.config()

class UsersServices {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN }
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN }
    })
  }

  async checkEmailExist(email: string) {
    // vào database và tìm user sỡ hữu email đó, nếu có thì nghĩa là có người xài rồi
    const user = await databaseServices.users.findOne({ email })
    return Boolean(user)
  }

  async checkRefreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    const refreshToken = await databaseServices.refreshTokens.findOne({
      user_id: new ObjectId(user_id),
      token: refresh_token
    })
    if (!refreshToken) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED, //401
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
      })
    } else {
      return refreshToken
    }
  }

  async checkEmailVerifyToken({
    user_id,
    email_verify_token
  }: {
    user_id: string
    email_verify_token: string //
  }) {
    // tìm user bằng user_id và email_verify_token
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      email_verify_token
    })
    //
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
        message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID
      })
    }
    return user //return ra ngoài để kiểm tra xem có verify hay gì không ?
  }

  async findUserById(user_id: string) {
    const user = await databaseServices.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND, //404
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    } else {
      return user //thay cho true
    }
  }

  async register(payload: RegisterReqBody) {
    // gọi database và tạo user từ email và password xog nhét vào
    // collection users
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    const result = await databaseServices.users.insertOne(
      new User({
        _id: user_id,
        email_verify_token,
        username: `user${user_id.toString()}`,
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth) //overwrite: ghi đè
      })
    )
    //tạo ac và rf
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id.toString()),
      this.signRefreshToken(user_id.toString())
    ])
    // gửi link có email_verify_token qua email
    console.log(`
      mô phỏng gửi link qua mail xác thực đăng ký: http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}
    `)
    //lưu refresh_token
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async login({ email, password }: { email: string; password: string }) {
    // dùng 2 thông tin này để tìm user
    const user = await databaseServices.users.findOne({
      email,
      password: hashPassword(password)
    })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
        message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT
      })
    }
    // nếu có thì tạo access và refresh token cho người dùng
    const user_id = user._id.toString()
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    //lưu refresh_token
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseServices.refreshTokens.deleteOne({ token: refresh_token })
  }

  async verifyEmail(user_id: string) {
    await databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          verify: UserVerifyStatus.Verified,
          email_verify_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    // tạo ac và rf để người dùng đăng nhập luôn
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    //lưu refresh_token
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    //ném ra object có 2 token
    return {
      access_token,
      refresh_token
    }
  }

  async resendEmailVerify(user_id: string) {
    //tạo lại mã evt
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    // tìm user bằng user_id để cập nhật lại mã
    await databaseServices.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    console.log(`
      mô phỏng gửi link qua mail xác thực đăng ký: http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}
    `)
  }

  async forgotPassword(email: string) {
    const user = (await databaseServices.users.findOne({
      email
    })) as User

    // lấy user_id tạo mã forgot_password_token
    const user_id = user._id as ObjectId
    const forgot_password_token = await this.signForgotPasswordToken(user_id.toString())
    // lưu vào database
    await databaseServices.users.updateOne(
      { _id: user_id }, //
      [
        {
          $set: {
            forgot_password_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //gửi mail
    console.log(
      `mô phỏng gửi link qua mail đổi mật khẩu: http://localhost:8000/users/reset-password/?forgot_password_token=${forgot_password_token}`
    )
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    //tìm user có user_id này và cập nhật password
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) }, // tìm
      [
        {
          $set: {
            password: hashPassword(password),
            forgot_password_token: '',
            updated_at: '$$NOW'
          }
        }
      ]
    )
  }

  async getMe(user_id: string) {
    const user = await databaseServices.users.findOne(
      { _id: new ObjectId(user_id) }, //
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return user
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeReqBody }) {
    // trong payload có 2 trường dữ liệu cần phải xử lý
    // date_of_birth
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    // username
    if (_payload.username) {
      //nếu có thì tìm xem có ai bị trùng không
      const user = await databaseServices.users.findOne({ username: _payload.username })
      if (user) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          message: USERS_MESSAGES.USERNAME_ALREADY_EXISTS
        })
      }
    }
    // nếu username truyền lên mà không có người dùng thì cập nhật
    const user = await databaseServices.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      [
        {
          $set: {
            ..._payload,
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async changePassword({
    user_id,
    password,
    old_password
  }: {
    user_id: string
    password: string
    old_password: string
  }) {
    //tìm user bằng username và old_password
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      password: hashPassword(old_password)
    })
    //nếu không có user thì throw error
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.UNAUTHORIZED //401
      })
    }
    //nếu có thì cập nhật lại password
    //cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi
    databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    //nếu bạn muốn ngta đổi mk xong tự động đăng nhập luôn thì trả về access_token và refresh_token
    //ở đây mình chỉ cho ngta đổi mk thôi, nên trả về message
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS // trong message.ts thêm CHANGE_PASSWORD_SUCCESS: 'Change password success'
    }
  }

  async refreshToken({
    user_id,
    refresh_token //
  }: {
    user_id: string
    refresh_token: string
  }) {
    // tạo ac và rf mới
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    // lưu rf mới
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        token: new_refresh_token,
        user_id: new ObjectId(user_id)
      })
    )

    // xóa rf cũ
    await databaseServices.refreshTokens.deleteOne({ token: refresh_token })
    //ném ra ac và rf mới cho người dùng
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }
}

// tạo instance
const usersServices = new UsersServices()
export default usersServices
