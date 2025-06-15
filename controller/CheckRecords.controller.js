import RecordKeeping from '../service/RecordKeeping.service.js';

async function checkRecord(req, res) {
  const rk = new RecordKeeping();
  const records = await rk.getTimeTrackingRecords();
  res.json(records);
}

export default checkRecord;
