const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'lazyboi.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create a transactions table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS timekeeping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dateTime TEXT,
      type TEXT,
      status TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  }
});

module.exports = db

