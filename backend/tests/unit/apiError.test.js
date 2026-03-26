const ApiError = require('../../src/utils/ApiError');

describe('ApiError', () => {
  it('should create an error with statusCode and message', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it('should support non-operational errors', () => {
    const err = new ApiError(500, 'DB crash', false);
    expect(err.isOperational).toBe(false);
  });

  it('should capture a stack trace', () => {
    const err = new ApiError(400, 'Bad request');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('Bad request');
  });

  it('should accept a custom stack', () => {
    const customStack = 'Error: custom\n  at blah.js:1:1';
    const err = new ApiError(500, 'test', true, customStack);
    expect(err.stack).toBe(customStack);
  });

  it('should default isOperational to true', () => {
    const err = new ApiError(422, 'Validation failed');
    expect(err.isOperational).toBe(true);
  });
});
