/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by tracking error rates and temporarily
 * disabling calls to failing services.
 * 
 * States:
 *   CLOSED  → Normal operation, requests pass through
 *   OPEN    → Service failing, requests immediately rejected
 *   HALF_OPEN → Testing if service recovered (allows 1 probe request)
 */

const STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
  /**
   * @param {Object} options
   * @param {string} options.name - Name of the protected service
   * @param {number} [options.failureThreshold=5] - Failures before opening
   * @param {number} [options.resetTimeoutMs=30000] - Ms before trying half-open
   * @param {number} [options.successThreshold=2] - Successes in half-open to close
   */
  constructor({ name, failureThreshold = 5, resetTimeoutMs = 30000, successThreshold = 2 }) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.successThreshold = successThreshold;

    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.stats = { totalCalls: 0, totalFailures: 0, totalRejected: 0 };
  }

  /**
   * Execute a function through the circuit breaker.
   * @param {Function} fn - Async function to protect
   * @returns {Promise<*>} Result of fn()
   * @throws {Error} If circuit is OPEN
   */
  async fire(fn) {
    this.stats.totalCalls++;

    if (this.state === STATE.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = STATE.HALF_OPEN;
        this.successCount = 0;
      } else {
        this.stats.totalRejected++;
        throw new Error(`CircuitBreaker [${this.name}]: Circuit is OPEN. Service unavailable.`);
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  _onSuccess() {
    if (this.state === STATE.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = STATE.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  _onFailure() {
    this.failureCount++;
    this.stats.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = STATE.OPEN;
    }
  }

  getState() {
    return this.state;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      ...this.stats,
      failureCount: this.failureCount
    };
  }

  reset() {
    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

// Pre-configured breakers for critical services
const breakers = {
  docker: new CircuitBreaker({ name: 'Docker', failureThreshold: 3, resetTimeoutMs: 15000 }),
  github: new CircuitBreaker({ name: 'GitHub API', failureThreshold: 5, resetTimeoutMs: 60000 }),
  database: new CircuitBreaker({ name: 'Database', failureThreshold: 3, resetTimeoutMs: 10000 })
};

module.exports = { CircuitBreaker, STATE, breakers };
