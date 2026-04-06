import express from 'express';
import nextCronFire from '../controller/NextCronFire.controller.js';
const router = express.Router();

router.get('/next-cron-fire', nextCronFire);

export default router;
