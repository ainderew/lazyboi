import JiraService from '../service/Jira.service.js';

class JiraController {
  async getUndoneTickets(req, res) {
    console.log('HITTING UNDONE TICKETS');
    try {
      const jService = new JiraService();
      const issues = await jService.getUnDoneTickets();

      res.json(issues);
    } catch (err) {
      console.error(`Error fetching undone tickets: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  }
}

export default JiraController;
