const express = require('express');
const { requireAuth } = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

const router = express.Router();

router.post('/', requireAuth, sessionController.createSession);
router.post('/join', requireAuth, sessionController.joinSession);
router.get('/:sessionId/users', requireAuth, sessionController.getSessionUsers);
router.patch('/:sessionId/users/:userId/role', requireAuth, sessionController.updateRole);
router.post('/:sessionId/end', requireAuth, sessionController.endSession);
router.get('/replay/:room', requireAuth, sessionController.getReplay);

module.exports = router;
