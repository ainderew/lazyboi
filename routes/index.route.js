const CheckRecords = require('./get-records.route');
const CheckCronStatus = require('./check-cron-status.route');
const CheckNextSproutAutomation = require('./check-next-sprout-automation.route');
const StartCron = require('./start-cron.route');
const Calendar = require('./get-calendar-data.route');
const GoogleOauth = require('./google-oauth.route');
const SpotifyOauth = require('./spotify-oauth.route');
const Spotify = require('./spotify.route');

module.exports = [
  Calendar,
  CheckCronStatus,
  CheckRecords,
  GoogleOauth,
  StartCron,
  Spotify,
  SpotifyOauth,
  CheckNextSproutAutomation,
];
