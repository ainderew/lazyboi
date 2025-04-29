const RecordKeeping = require('../service/RecordKeeping.service');

async function checkRecord(req, res) {
  const rk = new RecordKeeping();
  const records = await rk.getTimeTrackingRecords();
  res.json(records);
}

module.exports = checkRecord;
