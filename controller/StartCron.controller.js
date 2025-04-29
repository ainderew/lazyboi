const cron = require('node-cron');
const automateSprout = require('../login');
const retryCatch = require('../retryCatch');
const config = require('../utils/config');

/**
@typedef NextSproutAutomationType
@type {object}
@property {string} time
@property {string} mode
**/

function startCron(_, res) {
  res.send('CRON PAGE');

  if (config.IS_CRON_JOB_ACTIVE) return;

  config.IS_CRON_JOB_ACTIVE = true;

  cron.schedule(
    '0 7 * * 2-6',
    () => {
      const randomNum = Math.floor(Math.random() * (30 - 1 + 1)) + 1;

      console.log('LOGOUT');
      console.log(`Delayed by: ${randomNum} minutes`);

      /** @type {NextSproutAutomationType} */
      const nextSproutAutomationData = {
        time: `7:${randomNum}`,
        mode: 'OUT',
      };

      config.NEXT_SPROUT_AUTOMATION = nextSproutAutomationData;
      setTimeout(
        () => retryCatch(automateSprout, 'out', 10),
        randomNum * 1000 * 60,
      );
    },
    {
      scheduled: true,
      timezone: 'Asia/Manila',
    },
  );

  cron.schedule(
    '0 20 * * 1-5',
    () => {
      const randomNum = Math.floor(Math.random() * (30 - 1 + 1)) + 1;

      console.log('LOGIN');
      console.log(`Delayed by: ${randomNum} minutes`);

      /** @type {NextSproutAutomationType} */
      const nextSproutAutomationData = {
        time: `8:${randomNum}`,
        mode: 'IN',
      };
      config.NEXT_SPROUT_AUTOMATION = nextSproutAutomationData;
      setTimeout(
        () => retryCatch(automateSprout, 'in', 10),
        randomNum * 1000 * 60,
      );
    },
    {
      scheduled: true,
      timezone: 'Asia/Manila',
    },
  );
}

module.exports = startCron;
