const winston = require('winston');

/**
 * PRODUCTION-GRADE STRUCTURED LOGGING
 * Outputs machine-readable JSON in production for ELK/Loki ingestion.
 * Uses beautiful, colorized output in development.
 */

const nodeEnv = process.env.NODE_ENV || 'development';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { 
    service: process.env.OTEL_SERVICE_NAME || 'syncmesh-forge-backend',
    env: nodeEnv 
  },
  transports: [
    new winston.transports.Console({
      format: nodeEnv === 'production' 
        ? logFormat 
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              (info) => `${info.timestamp} [${info.level}] ${info.message}${info.stack ? '\n' + info.stack : ''}`
            )
          )
    })
  ],
  exitOnError: false
});

module.exports = logger;
