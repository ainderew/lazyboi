import CalendarService from '../service/Calendar.service.js';

async function calendarController(req, res) {
  const token = req.session?.token;
  if (!token)
    return res.status(401).json({ error: 'Unauthorized: Google Calendar' });

  try {
    const calService = new CalendarService();
    const events = await calService.getCalendarEvents(token);
    res.json(events || []);
  } catch (err) {
    console.error('Calendar error:', err.message);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
}

export default calendarController;
