import express from 'express';
import startCron from '../controller/StartCron.controller.js';
const router = express.Router();

router.get('/start-cron', startCron);

export default router;
