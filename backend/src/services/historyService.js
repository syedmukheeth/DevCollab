const crypto = require('crypto');
const path = require('path');
const AWS = require('aws-sdk');
const logger = require('../utils/logger');

/**
 * PRODUCTION-GRADE HISTORY SERVICE
 * Implements Merkle-tree style versioning for Yjs documents.
 * 
 * Features:
 * 1. Content-Addressing: Updates are stored as SHA-256 hashed chunks.
 * 2. Deduplication: Identical updates across rooms/restarts share the same physical storage.
 * 3. Incremental Backups: Only new delta chunks are uploaded to S3/MinIO.
 */

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const BUCKET = process.env.S3_BUCKET || 'syncmesh-forge-snapshots';

const getHash = (data) => crypto.createHash('sha256').update(data).digest('hex');

/**
 * Archives a Yjs update chunk to content-addressed storage.
 */
const archiveUpdate = async (updateBuffer) => {
  const hash = getHash(updateBuffer);
  const key = `chunks/${hash}`;

  try {
    // Check if chunk already exists (Deduplication)
    await s3.headObject({ Bucket: BUCKET, Key: key }).promise();
    return hash;
  } catch (err) {
    if (err.code !== 'NotFound') throw err;

    // Upload new chunk
    await s3.putObject({
      Bucket: BUCKET,
      Key: key,
      Body: updateBuffer,
      ContentType: 'application/octet-stream',
      Metadata: { 'Content-SHA256': hash }
    }).promise();
    
    return hash;
  }
};

/**
 * Creates a version checkpoint (Merkle Root) for a room.
 */
const createCheckpoint = async (room, chunkHashes) => {
  const checkpoint = {
    room,
    timestamp: new Date().toISOString(),
    chunks: chunkHashes, // List of SHA-256 addresses
    version: 1
  };

  const checkpointData = JSON.stringify(checkpoint);
  const checkpointHash = getHash(checkpointData);
  const key = `checkpoints/${room}/${checkpointHash}.json`;

  await s3.putObject({
    Bucket: BUCKET,
    Key: key,
    Body: checkpointData,
    ContentType: 'application/json'
  }).promise();

  return { checkpointHash, key };
};

/**
 * Replays a version from S3 chunks.
 */
const getVersionData = async (checkpointKey) => {
  const data = await s3.getObject({ Bucket: BUCKET, Key: checkpointKey }).promise();
  const checkpoint = JSON.parse(data.Body.toString());

  const chunks = await Promise.all(
    checkpoint.chunks.map(async (hash) => {
      const chunkData = await s3.getObject({ Bucket: BUCKET, Key: `chunks/${hash}` }).promise();
      return new Uint8Array(chunkData.Body);
    })
  );

  return chunks;
};

/**
 * Lists all checkpoints for a room.
 */
const listCheckpoints = async (room) => {
  const prefix = `checkpoints/${room}/`;
  const data = await s3.listObjectsV2({
    Bucket: BUCKET,
    Prefix: prefix
  }).promise();
  
  return data.Contents.map(obj => ({
    key: obj.Key,
    lastModified: obj.LastModified,
    hash: path.basename(obj.Key, '.json')
  })).sort((a, b) => b.lastModified - a.lastModified);
};

module.exports = {
  archiveUpdate,
  createCheckpoint,
  getVersionData,
  listCheckpoints
};
