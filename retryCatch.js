const RecordKeeping = require('./service/RecordKeeping.service');
const logger = require('./utils/logger');

async function retryCatch(callback, loginMode, retries) {
  try {
    await callback(loginMode);
    return true;
  } catch (error) {
    logger.log({ level: 'error', message: `retry function: ${error.message}` });
    if (retries > 0) {
      logger.log({
        level: 'info',
        message: `RETRYING: retries left - ${retries}`,
      });
      await retryCatch(callback, loginMode, retries - 1);
    } else {
      console.error(error);
      logger.error({ message: error.message, stack: error.stack });
      const rk = new RecordKeeping();
      rk.writeFailedAttempt(loginMode);
      return false;
    }
  }
}

module.exports = retryCatch;
