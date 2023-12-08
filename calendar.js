import { getEvents } from './api.js';

const isEndTimeTomorrow = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() + 1);
  return now.getTime() === end.getTime();
};

const datetimeToPosition = (dateTime) => {
  const date = new Date(dateTime);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  return (totalMinutes / (24 * 60)) * 897; // 897 is the final width of the timeline
};

const formatTime = (dateTime, withPeriod = true) => {
  const date = new Date(dateTime);
  const options = { hour: 'numeric', minute: 'numeric', hour12: true };
  let time = date.toLocaleTimeString('en-US', options).toLowerCase();

  if (!withPeriod) {
    time = time.slice(0, -3);
  }

  return time;
};

const renderEventPill = (event, index, previousEndTime) => {
  const pillHeight = 8;

  const startPixel = datetimeToPosition(event.start.dateTime);

  const endDateTime = new Date(event.end.dateTime);

  if (isEndTimeTomorrow(endDateTime)) {
    endDateTime.setHours(23);
    endDateTime.setMinutes(59);
  }

  const endPixel = datetimeToPosition(endDateTime);

  const eventElement = document.createElement('div');
  eventElement.className = 'event';
  eventElement.style.left = `${startPixel}px`;
  eventElement.style.width = `${endPixel - startPixel}px`;
  eventElement.style.height = `${pillHeight}px`;
  eventElement.dataset.id = event.id;

  if (event.status === 'tentative') {
    eventElement.classList.add('tentative');
  }

  const now = new Date();

  const eventStart = new Date(event.start.dateTime);
  const eventEnd = new Date(event.end.dateTime);

  if (now >= eventStart && now <= eventEnd) {
    eventElement.classList.add('now');
  }

  if (eventEnd < now) {
    eventElement.classList.add('past');
  }

  if (previousEndTime !== null && event.start.dateTime < previousEndTime) {
    eventElement.style.transform = `translateY(${pillHeight * index - 8}px)`;
  }

  eventElement.addEventListener('click', () => {
    window.open(event.htmlLink, '_blank');
  });

  return eventElement;
};

const renderTick = (hour) => {
  const tickElement = document.createElement('div');
  tickElement.className = 'tick';
  tickElement.style.left = `${(hour / 9) * 100}%`;

  if (hour % 2 !== 0) {
    const tickLabelElement = document.createElement('div');
    tickLabelElement.className = 'tick-label';
    const hourIn12HourFormat = hour % 12 === 0 ? '12' : hour % 12;
    const period = hour < 12 || hour === 24 ? 'am' : 'pm';
    tickLabelElement.textContent = `${hourIn12HourFormat} ${period}`;
    tickElement.appendChild(tickLabelElement);
  }

  return tickElement;
};

const renderNowTick = () => {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();

  const tickElement = document.createElement('div');
  tickElement.className = 'tick now';
  tickElement.style.left = `${((hour * 60 + minute) / (9 * 60)) * 100}%`;
  return tickElement;
};

const renderTodayLabel = () => {
  const todayLabel = document.createElement('span');
  const today = new Date();
  todayLabel.textContent = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  return todayLabel;
};

export const generateCalendar = async () => {
  const today = new Date();

  const timelineElement = document.getElementById('timeline');
  const eventListElement = document.getElementById('event-list');
  const timelineActions = document.getElementById('timeline-actions');

  const todayLabel = renderTodayLabel();
  timelineActions.appendChild(todayLabel);

  const xAxisElement = document.createElement('div');
  xAxisElement.className = 'x-axis';
  timelineElement.appendChild(xAxisElement);

  for (let hour = 0; hour <= 24; hour++) {
    const tickElement = renderTick(hour);
    xAxisElement.appendChild(tickElement);
  }

  const nowTickElement = renderNowTick();
  xAxisElement.appendChild(nowTickElement);

  const events = await getEvents(today);

  // pills
  events.forEach((event, i) => {
    const previousEndTime = events[i - 1]?.end.dateTime ?? null;
    const eventElement = renderEventPill(event, i, previousEndTime);
    timelineElement.appendChild(eventElement);
  });

  // list
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // set the time to 00:00:00.000

  const futureEvents = events.filter((e) => {
    const eventStart = new Date(e.start.dateTime);
    const eventEnd = new Date(e.end.dateTime);
    return (
      (eventStart >= now && eventStart < tomorrow) ||
      (eventEnd > now && eventStart < tomorrow)
    );
  });

  futureEvents.forEach((event) => {
    const eventListItem = document.createElement('div');
    eventListItem.className = 'event-list-item';
    eventListItem.title = 'Open in Google Calendar';
    eventListItem.dataset.id = event.id;
    eventListItem.innerHTML = `
      <span>${event.summary}</span>
      <span>${formatTime(event.start.dateTime, false)} - ${formatTime(
      event.end.dateTime
    )}</span>
    `;

    const now = new Date();
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    if (now >= start && now <= end) {
      eventListItem.classList.add('now');
    }

    eventListItem.addEventListener('click', () => {
      window.open(event.htmlLink, '_blank');
    });

    eventListElement.appendChild(eventListItem);
  });

  if (futureEvents.length === 0) {
    const noEvents = document.createElement('div');
    noEvents.className = 'no-events';
    noEvents.textContent = 'No more events today';

    eventListElement.appendChild(noEvents);
  }

  // scroll the chart to 9am by default, or to the end if it's after 5pm
  timelineElement.scrollLeft = today.getHours() < 17 ? 320 : 561;

  // Add event listeners to the event pills and list items
  document.querySelectorAll('.event, .event-list-item').forEach((element) => {
    element.addEventListener('mouseover', () => {
      const id = element.dataset.id;
      document.querySelectorAll(`[data-id="${id}"]`).forEach((el) => {
        el.classList.add('hover');
      });
    });

    element.addEventListener('mouseout', () => {
      const id = element.dataset.id;
      document.querySelectorAll(`[data-id="${id}"]`).forEach((el) => {
        el.classList.remove('hover');
      });
    });
  });
};
