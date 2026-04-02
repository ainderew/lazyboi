import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.route.js';
import startAttendanceCron from './utils/cronManagement.js';
import AttendanceService from './service/Attendance.service.js';
import SlackService from './service/Slack.service.js';

/**
 * Main entry point for the server application.
 * Sets up middleware, routes, and starts the server.
 */
function main() {
  const app = express();
  const att = new AttendanceService();
  const slack = new SlackService();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  try {
    startAttendanceCron();
    app.use(
      session({
        secret: process.env.SESSION_SECRET || 'supersecret',
        resave: true,
        saveUninitialized: true,
        cookie: { secure: process.env.NODE_ENV === 'production' },
      }),
    );
    app.use('/', express.static(path.join(__dirname, 'public')));
    app.use('/boom', async function (_, res) {
      res.sendFile(path.join(__dirname, 'public/sproutAutomation.html'));
    });
    app.get('/test-login', async function (_, res) {
      try {
        await att.performAutomatedAttendance('in');
        res.sendFile(path.join(__dirname, 'public/testing.html'));
      } catch (error) {
        console.log(error);
        res.sendFile(path.join(__dirname, 'public/404.html'));
      }
    });

    app.get('/slack-setup', async function (_, res) {
      try {
        res.send('Slack browser opened — log in manually, then close the browser window.');
        await slack.setupSession();
      } catch (error) {
        console.log(error);
      }
    });

    app.get('/test-slack', async function (_, res) {
      try {
        const sent = await slack.sendMessage('In');
        res.send(sent ? 'Slack message sent' : 'Slack message failed');
      } catch (error) {
        console.log(error);
        res.send('Slack test failed');
      }
    });

    app.get('/test-logout', async function (_, res) {
      try {
        await att.performAutomatedAttendance('out');
        res.send('TEST LOGOUT ROUTE');
      } catch (error) {
        console.log(error);
        res.sendFile(path.join(__dirname, 'public/404.html'));
      }
    });

    routes.forEach((r) => app.use(r));

    app.listen(4200, () => {
      console.log('Server Running PORT: 4200');
    });
  } catch (error) {
    console.log(error);
    throw new Error(`Server Error: ${error.message}`);
  }
}

main();
