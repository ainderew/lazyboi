import express from 'express';
const router = express.Router();
import calendarController from '../controller/Calendar.controller.js';

router.get('/get-calendar-data', calendarController);

export default router;
