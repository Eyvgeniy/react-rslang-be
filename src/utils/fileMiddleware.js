const util = require('util');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');

const { MONGO_CONNECTION_STRING } = require('../common/config');

const storage = new GridFsStorage({
  url: MONGO_CONNECTION_STRING,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ['image/png', 'image/jpeg'];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-rslang-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: 'photos',
      filename: `${Date.now()}-rslang-${file.originalname}`
    };
  }
});

const uploadFile = multer({ storage }).single('file');
const uploadFilesMiddleware = util.promisify(uploadFile);
module.exports = { uploadFilesMiddleware };
