const express = require('express');
const startCron = require('../controller/StartCron.controller');
const router = express.Router();

router.get('/start-cron', startCron);

module.exports = router;
