import logger from './utils/logger.js';

async function retryCatch(callback, loginMode, retries, recordKeeping = null) {
  let attempt = 0;

  while (attempt < retries) {
    try {
      await callback(loginMode);
      return true;
    } catch (error) {
      attempt++;

      logger.log({
        level: 'error',
        message: `retry function: ${error.message}`,
      });

      if (attempt > retries) {
        console.error('No more tries - error:', error);
        logger.error({ message: error.message, stack: error.stack });

        if (recordKeeping) {
          recordKeeping.writeFailedAttempt(loginMode);
        }

        return false;
      }

      logger.info(`Retrying... remaining retries: ${retries - attempt}`);
    }
  }
}

export default retryCatch;
