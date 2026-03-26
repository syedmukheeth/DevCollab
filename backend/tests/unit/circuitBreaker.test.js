const { CircuitBreaker, STATE } = require('../../src/utils/circuitBreaker');

describe('CircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'TestService',
      failureThreshold: 3,
      resetTimeoutMs: 100,
      successThreshold: 2
    });
  });

  it('should start in CLOSED state', () => {
    expect(breaker.getState()).toBe(STATE.CLOSED);
  });

  it('should pass through successful calls in CLOSED state', async () => {
    const result = await breaker.fire(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
    expect(breaker.getState()).toBe(STATE.CLOSED);
  });

  it('should transition to OPEN after reaching failure threshold', async () => {
    const failFn = () => Promise.reject(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      await breaker.fire(failFn).catch(() => {});
    }

    expect(breaker.getState()).toBe(STATE.OPEN);
  });

  it('should reject calls immediately when OPEN', async () => {
    const failFn = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await breaker.fire(failFn).catch(() => {});
    }

    await expect(breaker.fire(() => Promise.resolve('ok')))
      .rejects.toThrow('Circuit is OPEN');
  });

  it('should transition to HALF_OPEN after reset timeout', async () => {
    const failFn = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await breaker.fire(failFn).catch(() => {});
    }

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Next call should go through (HALF_OPEN allows probe)
    const result = await breaker.fire(() => Promise.resolve('recovered'));
    expect(result).toBe('recovered');
  });

  it('should transition from HALF_OPEN to CLOSED after success threshold', async () => {
    const failFn = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await breaker.fire(failFn).catch(() => {});
    }

    await new Promise(resolve => setTimeout(resolve, 150));

    // Need 2 successes (successThreshold)
    await breaker.fire(() => Promise.resolve('ok'));
    await breaker.fire(() => Promise.resolve('ok'));
    expect(breaker.getState()).toBe(STATE.CLOSED);
  });

  it('should track stats correctly', async () => {
    await breaker.fire(() => Promise.resolve('ok'));
    await breaker.fire(() => Promise.reject(new Error('x'))).catch(() => {});

    const stats = breaker.getStats();
    expect(stats.totalCalls).toBe(2);
    expect(stats.totalFailures).toBe(1);
    expect(stats.name).toBe('TestService');
  });

  it('should reset correctly', async () => {
    const failFn = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await breaker.fire(failFn).catch(() => {});
    }
    expect(breaker.getState()).toBe(STATE.OPEN);

    breaker.reset();
    expect(breaker.getState()).toBe(STATE.CLOSED);
  });
});
