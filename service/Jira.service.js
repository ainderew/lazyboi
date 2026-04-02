import dotenv from 'dotenv';
dotenv.config();

class JiraService {
  constructor() {
    this.getUnDoneTickets = this.getUnDoneTickets.bind(this);
  }

  async getUnDoneTickets() {
    try {
      const email = process.env.JIRA_EMAIL;
      const apiToken = process.env.JIRA_API_KEY;
      const domain = process.env.JIRA_DOMAIN;

      const base64Credentials = Buffer.from(`${email}:${apiToken}`).toString(
        'base64',
      );

      const jql = 'assignee=currentUser() AND statusCategory != Done';
      const response = await fetch(
        `https://${domain}.atlassian.net/rest/api/3/search?jql=${encodeURIComponent(jql)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${base64Credentials}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.issues;
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }
}

export default JiraService;
