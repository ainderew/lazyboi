import express from 'express';
const router = express.Router();
import checkNextSproutAutomation from '../controller/CheckNextSproutAutomation.controller.js';

router.get('/check-next-sprout-automation', checkNextSproutAutomation);

export default router;
