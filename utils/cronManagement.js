import cron from 'node-cron';
import config from '../utils/config.js';
import AttendanceService from '../service/Attendance.service.js';
const attendanceService = new AttendanceService();

// keep in memory record of cron schedules
const CRON_SCHEDULES = {
  timeInTime: '0 20 * * 1-5',
  timeOutTime: '0 7 * * 2-6',
};

const CRON_OPTIONS = {
  scheduled: true,
  timezone: 'Asia/Manila',
};

function startAttendanceCron() {
  try {
    if (config.IS_CRON_JOB_ACTIVE) return;

    config.IS_CRON_JOB_ACTIVE = true;

    cron.schedule(
      CRON_SCHEDULES.timeOutTime,
      () => attendanceService.scheduleAttendance('out'),
      CRON_OPTIONS,
    );

    cron.schedule(
      CRON_SCHEDULES.timeInTime,
      () => attendanceService.scheduleAttendance('in'),
      CRON_OPTIONS,
    );
  } catch (error) {
    console.error('Error starting attendance cron:', error);
    throw new Error(`Cron Error: ${error}`);
  }
}

export default startAttendanceCron;
