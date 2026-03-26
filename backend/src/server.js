require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { parseEnv } = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const projectRoutes = require('./routes/projectRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { createCollabServer } = require('./realtime/collabServer');
const githubRoutes = require('./routes/githubRoutes');
const authRoutes = require('./routes/authRoutes');
const { verifyAuthToken } = require('./utils/authToken');

const sessionRoutes = require('./routes/sessionRoutes');

const env = parseEnv();

const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN || '*',
    credentials: false
  })
);
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "script-src": ["'self'"],
      "object-src": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(morgan('dev'));

// Extract userId from auth header for rate limiting without enforcing it
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAuthToken(token, process.env.SESSION_SECRET);
      if (decoded && decoded.userId) {
        req.userId = decoded.userId;
      }
    } catch (e) { /* ignore invalid tokens for rate limiting */ }
  }
  next();
});

// Per-user rate limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 600, // max 600 requests per minute per IP/User
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.userId || req.ip;
    },
    message: { message: "Too many requests, please try again later." }
  })
);

app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  uptime: process.uptime(),
  timestamp: new Date().toISOString()
}));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', fileRoutes);
app.use('/api', githubRoutes);
app.use('/api/sessions', sessionRoutes);

app.use(notFound);
app.use(errorHandler);

let dbReady = false;
let redisReady = null; // null=disabled

app.get('/ready', (req, res) => {
  const ok = dbReady && (redisReady === null || redisReady === true);
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ready' : 'not_ready',
    database: dbReady ? 'up' : 'down',
    redis: redisReady === null ? 'disabled' : redisReady ? 'up' : 'down',
    services: {
      api: 'up',
      collaboration: redisReady === null || redisReady ? 'ready' : 'degraded'
    }
  });
});

const start = async () => {
  await connectDB.connectDB();
  dbReady = true;

  const httpServer = http.createServer(app);

  try {
    const { redisConnected } = await createCollabServer({
      httpServer,
      corsOrigin: env.SOCKET_ORIGIN || env.CLIENT_ORIGIN || '*',
      redisUrl: env.REDIS_URL
    });
    redisReady = typeof redisConnected === 'boolean' ? redisConnected : null;
  } catch (err) {
    redisReady = false;
    throw err;
  }

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${env.PORT}`);
  });

  const shutdown = () => {
    // eslint-disable-next-line no-console
    console.log('Shutting down...');
    httpServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

// ── Graceful Process Error Handling ──
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
