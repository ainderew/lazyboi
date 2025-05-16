const JiraService = require('../service/Jira.service');

class JiraController {
  async getUndoneTickets(req, res) {
    console.log('HITTING UNDONE TICKETS');
    try {
      const jService = new JiraService();
      const issues = await jService.getUnDoneTickets();

      res.json(issues);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = JiraController;
