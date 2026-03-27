const Sentry = require('@sentry/node');

/**
 * Initializes Sentry for the Express application.
 * Optimized for Sentry Node SDK v8+
 */
const initSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('⚠️ Sentry DSN not found. Skipping Sentry initialization.');
    return;
  }

  Sentry.init({
    dsn: dsn,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });

  console.log('🛡️ Sentry initialized on Backend');
};

/**
 * Sets up global error handlers for Express.
 * Must be called AFTER all routes.
 */
const setupErrorHandlers = (app) => {
  // Use v8+ Express error handler
  Sentry.setupExpressErrorHandler(app);
};

module.exports = {
  initSentry,
  setupErrorHandlers
};
