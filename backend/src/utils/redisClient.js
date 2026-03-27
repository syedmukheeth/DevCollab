const Redis = require('ioredis');
const logger = require('./logger');

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
};

const redis = new Redis(redisOptions);

redis.on('connect', () => logger.info('Redis connected successfully'));
redis.on('error', (err) => logger.error('Redis connection error:', err));

/**
 * Cache utility for getting/setting JSON values
 */
const cache = {
  async get(key) {
    try {
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  async set(key, value, ttlSeconds = 3600) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      logger.error(`Failed to set cache for ${key}:`, err);
    }
  },
  async del(key) {
    try {
      await redis.del(key);
    } catch (err) {
      logger.error(`Failed to delete cache for ${key}:`, err);
    }
  },
  async delPrefix(prefix) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.error(`Failed to delete prefix cache for ${prefix}:`, err);
    }
  }
};

module.exports = { redis, cache };
