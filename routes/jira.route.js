const express = require('express');
const JiraController = require('../controller/Jira.controller');
const router = express.Router();

const jController = new JiraController();

router.get('/jira/user-undone-tickets', jController.getUndoneTickets);

module.exports = router;
