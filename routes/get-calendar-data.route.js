const express = require('express');
const router = express.Router();
const calendarController = require('../controller/Calendar.controller');

router.get('/get-calendar-data', calendarController);

module.exports = router;
