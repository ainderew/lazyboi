import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.route.js';
import startAttendanceCron from './utils/cronManagement.js';
import AttendanceService from './service/Attendance.service.js';

/**
 * Main entry point for the server application.
 * Sets up middleware, routes, and starts the server.
 */
function main() {
  const app = express();
  const att = new AttendanceService();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  try {
    startAttendanceCron();
    app.use(
      session({
        secret: 'supersecret',
        resave: true,
        saveUninitialized: true,
        cookie: { secure: process.env.NODE_ENV === 'production' },
      }),
    );
    app.use('/', express.static(path.join(__dirname, 'public')));
    app.use('/boom', async function (_, res) {
      res.sendFile(path.join(__dirname, 'public/sproutAutomation.html'));
    });
    app.use('/test-login', async function (_, res) {
      try {
        await att.performAutomatedAttendance('in');
      } catch (error) {
        console.log(error);
        res.sendFile(path.join(__dirname, 'public/404.html'));
      }

      res.sendFile(path.join(__dirname, 'public/testing.html'));
    });

    app.get('/test-logout', async function (_, res) {
      try {
        await att.performAutomatedAttendance('out');
      } catch (error) {
        console.log(error);
        res.sendFile(path.join(__dirname, 'public/404.html'));
      }

      res.send('TEST LOGOUT ROUTE');
    });

    app.use(...routes);

    app.listen(4200, () => {
      console.log('Server Running PORT: 4200');
    });
  } catch (error) {
    console.log(error);
    throw new Error(`Server Error: ${error.message}`);
  }
}

main();
