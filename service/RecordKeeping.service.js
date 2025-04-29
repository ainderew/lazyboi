const db = require('../db/initDB');
const logger = require('../utils/logger');

class RecordKeeping {
  #DATE_OPTION;

  constructor() {
    this.#DATE_OPTION = {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    };
  }

  writeRecord(mode) {
    const date = new Date();
    const philippineDateTime = date.toLocaleString('en-PH', this.#DATE_OPTION);

    db.run(
      `INSERT INTO timekeeping(dateTime, type, status) VALUES(?, ?, ?)`,
      [philippineDateTime, mode, 'success'],
      function (err) {
        if (err) {
          logger.error('WRITE RECORDS ERROR');
        }
        console.log('WRITE RECORD SUCCESS - type(normal write)');
      },
    );
  }

  writeFailedAttempt(mode) {
    const date = new Date();
    const philippineDateTime = date.toLocaleString('en-PH', this.#DATE_OPTION);

    db.run(
      `INSERT INTO timekeeping(dateTime, type, status) VALUES(?, ?, ?)`,
      [philippineDateTime, mode, 'failed'],
      function (err) {
        if (err) {
          console.log('WRITE RECORDS ERROR');
        }
        console.log('WRITE RECORD SUCCESS - type(failed attempt)');
      },
    );
  }

  getTimeTrackingRecords() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM timekeeping ORDER BY id DESC`, function (err, row) {
        if (err) {
          console.log(err);
          reject(err);
        }

        resolve(row);
      });
    });
  }
}

module.exports = RecordKeeping;
