const { toZonedTime } = require('date-fns-tz');
const { google } = require('googleapis');
const {
  setSeconds,
  setMinutes,
  setHours,
  addDays,
  format,
} = require('date-fns');

class CalendarService {
  async getCalendarEvents(tokens) {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials(tokens);

      const manilaNow = toZonedTime(new Date(), 'Asia/Manila');

      // 10:00 PM today
      const shiftStart = setSeconds(setMinutes(setHours(manilaNow, 22), 0), 0);

      // 6:00 AM tomorrow
      const shiftEnd = setSeconds(
        setMinutes(setHours(addDays(manilaNow, 1), 6), 0),
        0,
      );

      const timeMin = shiftStart.toISOString();
      const timeMax = shiftEnd.toISOString();

      const calendar = google.calendar({ version: 'v3', auth });
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      res.data.items.forEach(
        (item) =>
          (item.start.dateTime = format(
            item.start.dateTime || item.start.date,
            'MMM dd, yyyy - hh:mm aa',
          )),
      );

      return res.data.items;
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = CalendarService;
