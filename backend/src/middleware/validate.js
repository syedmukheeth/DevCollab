const { z } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Creates a validation middleware from a Zod schema.
 * Validates req.body, req.query, and req.params against the provided schemas.
 * 
 * @param {Object} schemas
 * @param {z.ZodSchema} [schemas.body] - Schema for request body
 * @param {z.ZodSchema} [schemas.query] - Schema for query params
 * @param {z.ZodSchema} [schemas.params] - Schema for route params
 * @returns {Function} Express middleware
 */
const validate = (schemas) => (req, res, next) => {
  const errors = [];

  if (schemas.body) {
    const result = schemas.body.safeParse(req.body);
    if (!result.success) {
      errors.push(...result.error.issues.map(i => ({
        field: `body.${i.path.join('.')}`,
        message: i.message
      })));
    } else {
      req.body = result.data;
    }
  }

  if (schemas.query) {
    const result = schemas.query.safeParse(req.query);
    if (!result.success) {
      errors.push(...result.error.issues.map(i => ({
        field: `query.${i.path.join('.')}`,
        message: i.message
      })));
    } else {
      req.query = result.data;
    }
  }

  if (schemas.params) {
    const result = schemas.params.safeParse(req.params);
    if (!result.success) {
      errors.push(...result.error.issues.map(i => ({
        field: `params.${i.path.join('.')}`,
        message: i.message
      })));
    } else {
      req.params = result.data;
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(422, `Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join('; ')}`));
  }

  next();
};

// ── Common Schemas ──

const projectSchemas = {
  create: {
    body: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional()
    })
  },
  getById: {
    params: z.object({
      id: z.string().uuid()
    })
  }
};

const fileSchemas = {
  create: {
    body: z.object({
      name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename'),
      content: z.string().max(1_000_000).optional().default('')
    })
  },
  update: {
    body: z.object({
      content: z.string().max(1_000_000)
    })
  }
};

const sessionSchemas = {
  create: {
    body: z.object({
      projectId: z.string().uuid(),
      interviewMode: z.boolean().optional().default(false)
    })
  },
  join: {
    body: z.object({
      shareLink: z.string().uuid()
    })
  },
  updateRole: {
    body: z.object({
      targetUserId: z.string().uuid(),
      newRole: z.enum(['VIEWER', 'EDITOR', 'INTERVIEWER'])
    })
  }
};

const executeSchema = {
  body: z.object({
    code: z.string().min(1).max(100_000),
    language: z.string().min(1).max(20),
    fileId: z.string().optional(),
    sessionId: z.string().optional()
  })
};

module.exports = {
  validate,
  projectSchemas,
  fileSchemas,
  sessionSchemas,
  executeSchema
};
