import express from 'express';
const router = express.Router();
import checkCronStatus from '../controller/CheckCronStatus.controller.js';

router.get('/check-cron-status', checkCronStatus);

export default router;
