import { Request } from 'express'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getNameFromFullNameFile, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { mediaType } from '~/constants/enums'
import { Media } from '~/models/Other'
class MediasServices {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    //_dirname: đường dẫn đến folder đang chạy file này
    //path.resolve('uploads'): đường dẫn đến thư mục mà anh muốn lưu trữ
    //tạo cái khung để khi người dùng gữi file lên sẽ bị mình dùng khung đó
    //để kiểm tra (ép kiểu)
    const result = await Promise.all(
      files.map(async (file) => {
        const newFileName = getNameFromFullNameFile(file.newFilename) + '.jpeg'
        // dặt tên mới cho file
        const newPath = UPLOAD_IMAGE_DIR + '/' + newFileName
        // optimize lại bức hình
        const infor = await sharp(file.filepath).jpeg().toFile(newPath)
        // filepath: là đường dẫn đến cái file cần optimize
        fs.unlinkSync(file.filepath)
        // cung cấp route link để người dùng vào xem hình vừa up
        return {
          url: `http://localhost:3000/static/image/${newFileName}`,
          type: mediaType.Image
        } as Media
      })
    )
    return result
  }

  async handleUploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    //_dirname: đường dẫn đến folder đang chạy file này
    //path.resolve('uploads'): đường dẫn đến thư mục mà anh muốn lưu trữ
    //tạo cái khung để khi người dùng gữi file lên sẽ bị mình dùng khung đó
    //để kiểm tra (ép kiểu)
    const result = await Promise.all(
      files.map(async (file) => {
        const newFileName = file.newFilename
        // dặt tên mới cho file
        const newPath = UPLOAD_VIDEO_DIR + '/' + newFileName

        return {
          url: `http://localhost:3000/static/video/${newFileName}`,
          type: mediaType.Video
        } as Media
      })
    )
    return result
  }
}

const mediasServices = new MediasServices()
export default mediasServices
