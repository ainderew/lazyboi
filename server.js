const express = require('express');
const app = express();
const path = require('path');
const automateSprout = require('./login');
const retryCatch = require('./retryCatch');
const db = require('./db/initDB');

const RecordKeeping = require('./service/RecordKeeping.service');
const { LOGIN_MODE } = require('./enums');
const logger = require('./utils/logger');
const routes = require('./routes/index.route.js');

app.use('/boom', express.static(path.join(__dirname, 'public')));

app.get('/', function (_, res) {
  console.log('SOMEONE PINGED ME');
  res.send({ Status: 200 });
});

app.use('/test-login', async function (_, res) {
  logger.info('TEST LOGIN');
  res.sendFile(path.join(__dirname, 'public/testing.html'));
  const isSuccess = await retryCatch(automateSprout, 'in', 10);
});

app.get('/test-logout', async function (_, res) {
  await automateSprout(LOGIN_MODE.out);
  res.send('TEST LOGOUT ROUTE');
});

app.use(...routes);

app.listen(4200, () => {
  console.log('Server Running PORT: 4200');
});
