var express = require('express');
var router = express.Router();
let messageController = require('../controllers/messages');
let authHandler = require('../utils/authHandler');
let uploadHandler = require('../utils/uploadHandler');

router.use(authHandler.CheckLogin);

router.post('/', uploadHandler.uploadFile.single('file'), messageController.sendMessage);

router.get('/', messageController.getLastMessages);

router.get('/:userID', messageController.getMessagesWithUser);

module.exports = router;