const request = require('supertest');
const express = require('express');

// Mock logger before importing middleware that uses it
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const { errorHandler, notFound } = require('../src/middleware/errorHandler');

// Simple test app setup
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: 100 }));
app.get('/ready', (req, res) => res.json({ status: 'ready', database: 'up' }));

describe('API Basic Endpoints', () => {
  test('GET /health should return 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /ready should return 200 and status ready', async () => {
    const res = await request(app).get('/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});
