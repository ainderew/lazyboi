const CalendarService = require('../service/Calendar.service');

async function calendarController(req, res) {
  const token = req.session?.token;
  if (!token)
    return res.status(401).json({ error: 'Unauthorized: Google Calendar' });

  const calService = new CalendarService();
  const resa = await calService.getCalendarEvents(token);
  res.json(resa);
}

module.exports = calendarController;
