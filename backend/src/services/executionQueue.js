/**
 * Execution Queue with Concurrency Control
 * 
 * Manages code execution jobs with:
 * - Configurable max concurrent containers
 * - Priority levels (INTERACTIVE > BATCH)
 * - Queue depth monitoring
 * - Automatic timeout enforcement
 */

const EventEmitter = require('events');

const PRIORITY = {
  INTERACTIVE: 0,  // User-triggered, highest priority
  BATCH: 1         // Background jobs
};

class ExecutionQueue extends EventEmitter {
  /**
   * @param {Object} options
   * @param {number} [options.maxConcurrent=3] - Max simultaneous containers
   * @param {number} [options.maxQueueSize=50] - Max pending jobs
   * @param {number} [options.defaultTimeoutMs=15000] - Default execution timeout
   */
  constructor({ maxConcurrent = 3, maxQueueSize = 50, defaultTimeoutMs = 15000 } = {}) {
    super();
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.queue = [];      // Pending jobs
    this.active = 0;      // Currently running
    this.stats = {
      totalEnqueued: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalRejected: 0,
      totalTimeouts: 0
    };
  }

  /**
   * Enqueue a code execution job.
   * @param {Object} job
   * @param {string} job.code - Code to execute
   * @param {string} job.language - Language identifier
   * @param {Function} job.onData - Callback for stdout/stderr data
   * @param {Function} job.onDone - Callback when execution completes
   * @param {number} [job.priority=PRIORITY.INTERACTIVE]
   * @param {number} [job.timeoutMs] - Override default timeout
   * @returns {string} Job ID
   */
  enqueue(job) {
    if (this.queue.length >= this.maxQueueSize) {
      this.stats.totalRejected++;
      job.onDone(null, new Error('Execution queue is full. Please try again later.'));
      return null;
    }

    const jobId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      id: jobId,
      ...job,
      priority: job.priority ?? PRIORITY.INTERACTIVE,
      timeoutMs: job.timeoutMs ?? this.defaultTimeoutMs,
      enqueuedAt: Date.now()
    };

    // Insert sorted by priority (lower number = higher priority)
    const insertIdx = this.queue.findIndex(q => q.priority > entry.priority);
    if (insertIdx === -1) {
      this.queue.push(entry);
    } else {
      this.queue.splice(insertIdx, 0, entry);
    }

    this.stats.totalEnqueued++;
    this.emit('enqueued', { jobId, queueDepth: this.queue.length, active: this.active });
    this._processNext();
    return jobId;
  }

  async _processNext() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) return;

    const job = this.queue.shift();
    this.active++;
    this.emit('started', { jobId: job.id, active: this.active, queueDepth: this.queue.length });

    try {
      const { runCode } = require('../services/executionService');
      await runCode({
        code: job.code,
        language: job.language,
        onData: job.onData,
        onDone: (exitCode, err) => {
          if (err) {
            this.stats.totalFailed++;
          } else {
            this.stats.totalCompleted++;
          }
          job.onDone(exitCode, err);
        },
        timeoutMs: job.timeoutMs
      });
    } catch (err) {
      this.stats.totalFailed++;
      job.onDone(null, err);
    } finally {
      this.active--;
      this.emit('completed', { jobId: job.id, active: this.active, queueDepth: this.queue.length });
      this._processNext();
    }
  }

  getStatus() {
    return {
      active: this.active,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      ...this.stats
    };
  }
}

// Singleton instance
const executionQueue = new ExecutionQueue();

module.exports = { ExecutionQueue, PRIORITY, executionQueue };
