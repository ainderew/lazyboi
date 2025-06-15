import startAttendanceCron from '../utils/cronManagement.js';

function startCron(_, res) {
  res.send('MANUALLY STARTING ATTENDANCE CRON');
  startAttendanceCron();
}

export default startCron;
