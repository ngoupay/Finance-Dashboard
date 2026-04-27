const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const maxSize = 10 * 1024 * 1024;

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/vnd.ms-excel': 'csv'
};

aws.config.update({
  secretAccessKey: process.env.S3_ACCESS_KEY,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  region: process.env.S3_REGION
});

const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    limits: { fileSize: maxSize },
    s3: s3,
    bucket: process.env.S3_BUCKET,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const name = file.originalname.toLowerCase().split(' ').join('-');
      const ext = MIME_TYPE_MAP[file.mimetype] || file.originalname.split('.').pop();
      cb(null, name + '-' + Date.now() + '.' + ext);
    }
  })
});

module.exports = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'csvFile', maxCount: 1 }
]);
