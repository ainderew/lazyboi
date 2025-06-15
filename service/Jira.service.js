import dotenv from 'dotenv';
dotenv.config();

class JiraService {
  constructor() {
    this.getUnDoneTickets = this.getUnDoneTickets.bind(this);
  }

  async getUnDoneTickets() {
    try {
      const email = 'pinon@theoriamedical.com';
      //the value in the .env is generated manually for each individual
      //TODO: re-design to obtain it from user
      const apiToken = process.env.JIRA_API_KEY;
      const domain = 'theoriamedical'; // e.g. yourteam.atlassian.net

      const base64Credentials = Buffer.from(`${email}:${apiToken}`).toString(
        'base64',
      );

      const response = await fetch(
        `https://${domain}.atlassian.net/rest/api/3/search?jql=assignee=currentUser() AND statusCategory != Done`,
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
