const express = require('express');
const os = require('os');
const { getQueueMetrics } = require('../services/executionQueue');
// mock requires for execution metrics if we didn't export them, but os and standard memory is fine.

const router = express.Router();

router.get('/system', (req, res) => {
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  
  // Try to get queue depth if the service exports it, else mock it
  let qDepth = 0;
  let running = 0;
  try {
    const qm = getQueueMetrics();
    qDepth = qm.depth;
    running = qm.running;
  } catch (_e) { /* ignore */ }

  res.json({
    memory: {
      total: memTotal,
      free: memFree,
      usagePercent: ((memTotal - memFree) / memTotal * 100).toFixed(2) + '%'
    },
    cpuStats: os.loadavg(),
    executionQueue: {
      depth: qDepth,
      runningWorkers: running,
      concurrencyLimit: 3
    },
    activeWebSockets: 0 // Mock, actual needs tracking in collabServer
  });
});

module.exports = router;
