// dựng server với express
import express from 'express'
import userRouter from './routes/users.routers'
import databaseServices from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediaRouter from './routes/medias.routers'
import { initFolder } from './utils/file'
import staticRouter from './routes/static.routers'

const app = express()
const PORT = 3000
databaseServices.connect() //kết nối database
initFolder()
// server dùng 1 middleware biến đổi req dạng json
app.use(express.json())
// server dùng cái route đã tạo
app.use('/users', userRouter)
app.use('/medias', mediaRouter)
app.use('/static', staticRouter)
// localhost: 3000/user/login
app.use(defaultErrorHandler)
app.listen(PORT, () => {
  console.log('SERVER BE đang chạy trên port: ' + PORT)
})
