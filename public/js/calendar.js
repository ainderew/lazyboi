const calendarEventList = document.querySelector('.calendar-event-list');

//TODO: change before pushing
const isProd = true;
const API_ENDPOINT = isProd ? 'https://workdash.site' : 'http://localhost:4200';
// reminder comment proper

fetch(`${API_ENDPOINT}/get-calendar-data`)
  .then((res) => res.json())
  .then((data) => {
    if (data.status > 400) {
      alert('GOOGLE UNAUTHORIZED');
      return;
    }

    handleCalendarData(data);
  })
  .catch((err) => console.log(err));

function handleCalendarData(responseData) {
  const createdCalendarList = responseData.map((el, index) => {
    const calendarItem = document.createElement('div');
    calendarItem.className = 'calendar-item element';

    const calendarTitle = document.createElement('span');
    calendarTitle.className = 'calendar-item-title';
    calendarTitle.innerText = el.summary;
    console.log(el.summary);

    const calendarDateTag = document.createElement('div');
    calendarDateTag.className = 'calendar-date-tag';
    calendarDateTag.textContent = el.start.dateTime || el.start.date;

    if (index === 0) {
      calendarDateTag.classList.add('calendar-date-tag-latest');
    } else {
      const calendarDateTagCircle = document.createElement('div');
      calendarDateTagCircle.className = 'calendar-date-tag-circle';
      calendarDateTag.prepend(calendarDateTagCircle);
    }

    calendarItem.appendChild(calendarDateTag);
    calendarItem.appendChild(calendarTitle);
    calendarItem.addEventListener('click', () =>
      window.open(el.htmlLink, '_blank'),
    );

    return calendarItem;
  });

  createdCalendarList.forEach((resonseElement) =>
    calendarEventList.appendChild(resonseElement),
  );

  // calendar cont itemsu
  const calendarItemNumber = document.querySelector('.calendar-list-number');
  calendarItemNumber.innerText = createdCalendarList.length;
}
