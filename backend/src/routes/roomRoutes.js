const express = require('express');
const roomController = require('../controllers/roomController');
const router = express.Router();

router.post('/', roomController.createRoom);
router.get('/:code', roomController.getByRoomId);
router.post('/:code/question', roomController.createQuestions);
router.get('/:code/question', roomController.getQuestions);

module.exports = router;
