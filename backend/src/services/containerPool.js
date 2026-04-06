const Docker = require('dockerode');
const { RUNTIMES } = require('./executionService');
const logger = require('../utils/logger');

/**
 * PRODUCTION-GRADE CONTAINER POOLING
 * Pre-creates and warms up Docker containers to ensure <200ms startup times.
 */

class ContainerPool {
  constructor() {
    this.docker = new Docker();
    this.pools = {}; // { runtime: [containerId, ...] }
    this.targetSize = 3; // Keep 3 warmed containers per runtime
  }

  async initialize() {
    const isDockerless = process.env.RENDER || process.env.DOCKERLESS || true;
    if (isDockerless) {
      logger.info('Dockerless mode enabled. Skipping Container Pool initialization.');
      return;
    }
  
    logger.info('Initializing Container Pool...');
    for (const runtime of Object.keys(RUNTIMES)) {
      this.pools[runtime] = [];
      await this.replenish(runtime);
    }
  }

  async replenish(runtime) {
    const currentSize = this.pools[runtime].length;
    const needed = this.targetSize - currentSize;

    if (needed <= 0) return;

    logger.info(`Replenishing pool for ${runtime}: adding ${needed} containers`);

    for (let i = 0; i < needed; i++) {
      try {
        const container = await this.createWarmedContainer(runtime);
        this.pools[runtime].push(container);
      } catch (err) {
        logger.error(`Failed to pre-warm container for ${runtime}: ${err.message}`);
      }
    }
  }

  async createWarmedContainer(runtimeName) {
    const runtime = RUNTIMES[runtimeName];
    
    // Create container but DON'T start it yet, or start it in a "wait" state.
    // For PTY/Interactive, we usually want to start it with the shell.
    // Here we'll just pre-create them.
    const container = await this.docker.createContainer({
      Image: runtime.image,
      Cmd: ['sleep', 'infinity'], // Keep it alive but idle
      Tty: true,
      User: '1000:1000',
      HostConfig: {
        Memory: 128 * 1024 * 1024,
        MemorySwap: 128 * 1024 * 1024,
        NanoCpus: 500000000,
        NetworkMode: 'none',
        PidsLimit: 32,
        ReadonlyRootfs: true,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges']
      }
    });

    await container.start();
    return container;
  }

  async getContainer(runtimeName) {
    if (!this.pools[runtimeName] || this.pools[runtimeName].length === 0) {
      // Fallback: create on the fly if pool is empty
      return this.createWarmedContainer(runtimeName);
    }

    const container = this.pools[runtimeName].shift();
    // Asynchronously replenish
    this.replenish(runtimeName).catch(err => logger.error(`Pool replenish error: ${err.message}`));
    
    return container;
  }
}

module.exports = new ContainerPool();
