const express = require('express');
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', ...roomController.createRoom);
router.post('/:code/join', ...roomController.joinRoom);
router.get('/:code', roomController.getByRoomId);
router.post('/:code/question', ...roomController.createQuestions);
router.get('/:code/question', roomController.getQuestions);
router.delete('/:code', roomController.deleteRoom);
router.delete('/question/:id', roomController.deleteQuestion);
router.get('/:code/summary', ...roomController.summarizeQuestions);
router.post('/cleanup', roomController.cleanupRooms);

module.exports = router;