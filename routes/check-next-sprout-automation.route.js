const express = require('express');
const router = express.Router();
const checkNextSproutAutomation = require('../controller/CheckNextSproutAutomation.controller');

router.get('/check-next-sprout-automation', checkNextSproutAutomation);

module.exports = router;
