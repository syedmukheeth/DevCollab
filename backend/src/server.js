require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const projectRoutes = require('./routes/projectRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { createCollabServer } = require('./realtime/collabServer');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/projects', projectRoutes);
app.use('/api', fileRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devcollab';

connectDB(MONGO_URI).then(() => {
  const httpServer = http.createServer(app);
  createCollabServer({
    httpServer,
    corsOrigin: process.env.SOCKET_ORIGIN || process.env.CLIENT_ORIGIN || '*'
  });

  httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
});

