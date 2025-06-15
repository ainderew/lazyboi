import JiraService from '../service/Jira.service.js';

class JiraController {
  async getUndoneTickets(req, res) {
    console.log('HITTING UNDONE TICKETS');
    try {
      const jService = new JiraService();
      const issues = await jService.getUnDoneTickets();

      res.json(issues);
    } catch (err) {
      throw new Error(`Error fetching undone tickets: ${err.message}`);
    }
  }
}

export default JiraController;
