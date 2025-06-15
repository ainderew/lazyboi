import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MMM-DD HH:mm:ss',
    }),
    format.prettyPrint(),
    format.json(),
  ),

  transports: [
    new transports.File({
      filename: 'logs/combined.log',
      level: 'info',
      eol: '\n\n',
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      eol: '\n\n',
      maxsize: 5000000,
      maxFiles: 4,
    }),
  ],
});

logger.exceptions.handle(
  new transports.File({
    filename: 'logs/exceptions.log',
    eol: '\n\n',
  }),
);

export default logger;
