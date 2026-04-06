const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure S3 client for MinIO
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  accessKeyId: process.env.S3_ACCESS_KEY || 'devcollab',
  secretAccessKey: process.env.S3_SECRET_KEY || 'devpassword',
  s3ForcePathStyle: true, // Required for MinIO
  signatureVersion: 'v4'
});

const bucketName = process.env.S3_BUCKET || 'syncmesh-forge-data';

// Initialize bucket
const initBucket = async () => {
  try {
    await s3.createBucket({ Bucket: bucketName }).promise();
    console.log(`✅ S3 Bucket "${bucketName}" ready`);
  } catch (err) {
    if (err.code === 'BucketAlreadyOwnedByYou' || err.code === 'BucketAlreadyExists') {
      console.log(`ℹ️ S3 Bucket "${bucketName}" already exists`);
    } else {
      console.error('❌ Failed to initialize S3 bucket', err);
    }
  }
};

// Multer S3 storage engine
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname, projectId: req.params.projectId || 'global' });
    },
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;
      const folder = req.params.projectId ? `projects/${req.params.projectId}/` : 'uploads/';
      cb(null, `${folder}${fileName}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const getSignedUrl = (key, expires = 3600) => {
  return s3.getSignedUrl('getObject', {
    Bucket: bucketName,
    Key: key,
    Expires: expires
  });
};

const deleteFile = async (key) => {
  return s3.deleteObject({
    Bucket: bucketName,
    Key: key
  }).promise();
};

const listProjectFiles = async (projectId) => {
  const prefix = `projects/${projectId}/`;
  const data = await s3.listObjectsV2({
    Bucket: bucketName,
    Prefix: prefix
  }).promise();
  
  return data.Contents.map(file => ({
    key: file.Key,
    name: path.basename(file.Key),
    size: file.Size,
    lastModified: file.LastModified,
    url: getSignedUrl(file.Key)
  }));
};

module.exports = {
  initBucket,
  upload,
  getSignedUrl,
  deleteFile,
  listProjectFiles
};
