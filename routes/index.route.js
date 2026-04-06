import CheckRecords from './get-records.route.js';
import CheckCronStatus from './check-cron-status.route.js';
import CheckNextSproutAutomation from './check-next-sprout-automation.route.js';
import NextCronFire from './next-cron-fire.route.js';
import StartCron from './start-cron.route.js';

export default [
  CheckCronStatus,
  CheckRecords,
  StartCron,
  CheckNextSproutAutomation,
  NextCronFire,
];
