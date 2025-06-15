import express from 'express';
import JiraController from '../controller/Jira.controller.js';

const router = express.Router();
const jController = new JiraController();

router.get('/jira/user-undone-tickets', jController.getUndoneTickets);

export default router;
