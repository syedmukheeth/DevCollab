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
const projectRoutes = require('./routes/projectRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { createCollabServer } = require('./realtime/collabServer');
const githubRoutes = require('./routes/githubRoutes');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const env = parseEnv();

const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN || '*',
    credentials: false
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', fileRoutes);
app.use('/api', githubRoutes);
app.use('/api/sessions', sessionRoutes);

app.use(notFound);
app.use(errorHandler);

let mongoReady = false;
let redisReady = null; // null=disabled

app.get('/ready', (req, res) => {
  const ok = mongoReady && (redisReady === null || redisReady === true);
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ready' : 'not_ready',
    mongo: mongoReady ? 'up' : 'down',
    redis: redisReady === null ? 'disabled' : redisReady ? 'up' : 'down'
  });
});

const start = async () => {
  await connectDB.connectDB();
  mongoReady = true;

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

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

