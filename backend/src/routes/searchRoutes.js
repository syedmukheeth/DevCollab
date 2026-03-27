const express = require('express');
const { prisma } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// Project-wide text search
router.get('/projects/:projectId/search', requireAuth, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { q, regex = 'false', caseSensitive = 'false' } = req.query;

    if (!q) {
      return res.json({ results: [] });
    }

    // Fetch all files for the project
    const files = await prisma.file.findMany({
      where: { projectId },
      select: { id: true, name: true, content: true }
    });

    const results = [];
    const isRegex = regex === 'true';
    const isCaseSensitive = caseSensitive === 'true';

    let searchPattern;
    if (isRegex) {
      try {
        searchPattern = new RegExp(q, isCaseSensitive ? 'g' : 'gi');
      } catch (e) {
        throw new ApiError(400, 'Invalid regex pattern');
      }
    }

    for (const file of files) {
      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        let match = false;
        if (isRegex) {
          match = searchPattern.test(line);
          // reset regex lastIndex for global searches if needed, but test() on single line is fine
        } else {
          const textToSearch = isCaseSensitive ? line : line.toLowerCase();
          const query = isCaseSensitive ? q : q.toLowerCase();
          match = textToSearch.includes(query);
        }

        if (match) {
          results.push({
            fileId: file.id,
            fileName: file.name,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }

    res.json({ results: results.slice(0, 500) }); // Cap at 500 results
  } catch (err) {
    next(err);
  }
});

module.exports = router;
