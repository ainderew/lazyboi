import express from 'express';
import checkRecord from '../controller/CheckRecords.controller.js';
const router = express.Router();

router.get('/get-records', checkRecord);

export default router;
