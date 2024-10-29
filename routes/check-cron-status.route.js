const express = require("express");
const router = express.Router();
const checkCronStatus = require("../controller/CheckCronStatus.controller");

router.get("/check-cron-status", checkCronStatus)

module.exports = router


