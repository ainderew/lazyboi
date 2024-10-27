const db = require("../db/initDB")

class RecordKeeping {
  constructor(mode) {
    this.mode = mode
  }

  writeRecord() {
    const date = new Date();
    const options = {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    };

    const philippineDateTime = date.toLocaleString('en-PH', options);

    db.run(`INSERT INTO timekeeping(dateTime, type, status) VALUES(?, ?, ?)`, [philippineDateTime, this.mode, "success"], function(err) {
      if (err) { console.log("WRITE RECORDS ERROR") }
      console.log("WRITE RECORD SUCCESS")
    })
  }

  writeFailedAttempt() {
    const date = new Date();
    const options = {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    };

    const philippineDateTime = date.toLocaleString('en-PH', options);

    db.run(`INSERT INTO timekeeping(dateTime, type, status) VALUES(?, ?, ?)`, [philippineDateTime, this.mode, "failed"], function(err) {
      if (err) { console.log("WRITE RECORDS ERROR") }
      console.log("WRITE RECORD SUCCESS")
    })
  }
}

module.exports = RecordKeeping
