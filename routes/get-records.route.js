const express = require('express');
const checkRecord = require('../controller/CheckRecords.controller');
const router = express.Router();

router.get('/get-records', checkRecord);

module.exports = router;
