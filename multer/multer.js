const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../public/product-images"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  const upload = multer({
     storage: storage,
     fileFilter:(req,file,cb)=>{

      if(!file.mimetype.startsWith('image/')){
       return cb(new Error('type error'))
      }

      const imageSize = 5 * 1024 * 1024

      if(file.size > imageSize){
        return cb(new Error('size error'))
      }

      cb(null,true)

     }
   });
  const multipleUpload = upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
  ]);
  // const singleUpload = upload.array('images', 3);
   module.exports = {upload,multipleUpload}