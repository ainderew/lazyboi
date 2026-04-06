import CheckRecords from './get-records.route.js';
import CheckCronStatus from './check-cron-status.route.js';
import CheckNextSproutAutomation from './check-next-sprout-automation.route.js';
import NextCronFire from './next-cron-fire.route.js';
import StartCron from './start-cron.route.js';
import Calendar from './get-calendar-data.route.js';
import GoogleOauth from './google-oauth.route.js';
import SpotifyOauth from './spotify-oauth.route.js';
import Spotify from './spotify.route.js';
import Jira from './jira.route.js';

export default [
  Calendar,
  CheckCronStatus,
  CheckRecords,
  GoogleOauth,
  Jira,
  StartCron,
  Spotify,
  SpotifyOauth,
  CheckNextSproutAutomation,
  NextCronFire,
];
