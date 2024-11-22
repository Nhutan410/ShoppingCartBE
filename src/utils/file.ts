import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs' //thư viện giúp thao tác với file trong máy tính
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
// initFolder hàm này kiểm tra thư mục lưu ảnh có chưa, chưa có thì tạo
export const initFolder = () => {
  //kiểm tra xem nếu theo đường dẫn trên có đến được folder uploads không
  ;[UPLOAD_VIDEO_TEMP_DIR, UPLOAD_IMAGE_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        //nếu không tồn tại thì tạo ra
        recursive: true //cho phép tạo folder nested vào nhau
        //uploads/image/bla bla bla
      }) //mkdirSync: giúp tạo thư mục
    }
  })
}

// handleUploadSingeImage: là hàm nhận vào req và ép req đi qua lưới lọc
// của formidable để lấy các file
//  và mình sẽ chỉ lấy các file nào là ảnh mà thôi
export const handleUploadImage = async (req: Request) => {
  // tạo lưới lọc
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    maxFileSize: 1024 * 300 * 4,
    keepExtensions: true, //giữ lại đuôi file
    filter: ({ name, originalFilename, mimetype }) => {
      // name: name|key đc truyền vào trong <input name = 'blabla'>
      // originalFilename: tên gốc của file
      // mimetype: định dạng kiểu của file
      // console.log(name, originalFilename, mimetype)
      // phải gửi file trong field có name là image vfa kiểu file image
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      // nếu k valid thì mình bắn lỗi về
      if (!valid) {
        form.emit('error' as any, new Error('File type not valid') as any)
      }
      return valid
    }
  })
  //xài form vừa tạo
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      if (!files.image) {
        return reject(new Error('Image is empty'))
      }
      return resolve(files.image as File[])
    })
  })
}

// hàm tiện ích, nhận vào filename: nhut.an.pnp => nhut-an
// lấy asdash bỏ .png để sau này thêm .jpeg
export const getNameFromFullNameFile = (filename: string) => {
  const nameArr = filename.split('.')
  nameArr.pop() //bỏ cuối
  return nameArr.join('-')
}

export const getExtension = (filename: string) => {
  const nameArr = filename.split('.')
  return nameArr.pop() //pop là xóa và trả ra pt bị xóa(pt cuối)
}

export const handleUploadVideo = async (req: Request) => {
  // tạo lưới lọc
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    maxFileSize: 1024 * 1024 * 50, //50mb
    keepExtensions: true, //giữ lại đuôi file
    filter: ({ name, originalFilename, mimetype }) => {
      // name: name|key đc truyền vào trong <input name = 'blabla'>
      // originalFilename: tên gốc của file
      // mimetype: định dạng kiểu của file
      // console.log(name, originalFilename, mimetype)
      // phải gửi file trong field có name là image vfa kiểu file image
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      // nếu k valid thì mình bắn lỗi về
      if (!valid) {
        form.emit('error' as any, new Error('File type not valid') as any)
      }
      return valid
    }
  })
  //xài form vừa tạo
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      if (!files.video) {
        return reject(new Error('Video is empty'))
      }
      return resolve(files.video as File[])
    })
  })
}
