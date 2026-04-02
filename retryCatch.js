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

      logger.info(`Retrying... remaining retries: ${retries - attempt}`);
    }
  }

  console.error('No more tries');
  logger.error({ message: 'All retries exhausted', loginMode });

  if (recordKeeping) {
    recordKeeping.writeFailedAttempt(loginMode);
  }

  return false;
}

export default retryCatch;
