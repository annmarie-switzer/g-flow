import { getEvents } from './api.js';

const datetimeToPosition = (dateTime, width, previousEndTime) => {
  const date = new Date(dateTime);
  const totalMinutes = (date.getHours() - 9) * 60 + date.getMinutes();
  return (totalMinutes / (8 * 60)) * width;
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

const renderEventPill = (event, index, width, previousEndTime) => {
  const pillHeight = 8;

  const startPixel = datetimeToPosition(event.start.dateTime, width);
  const endPixel = datetimeToPosition(event.end.dateTime, width);

  const eventElement = document.createElement('div');
  eventElement.className = 'event';
  eventElement.style.left = `${startPixel}px`;
  eventElement.style.width = `${endPixel - startPixel}px`;
  eventElement.style.height = `${pillHeight}px`;

  if (event.status === 'tentative') {
    eventElement.classList.add('tentative');
  }

  const now = new Date();
  // TODO - remove
  // now.setHours(14, 35, 0, 0);
  // now.setDate(now.getDate() + 1);

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
  tickElement.style.left = `${((hour - 9) / 8) * 100}%`;

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

  // // TODO - remove
  // const hour = 14;
  // const minute = 35;

  const tickElement = document.createElement('div');
  tickElement.className = 'tick now';
  tickElement.style.left = `${(((hour - 9) * 60 + minute) / (8 * 60)) * 100}%`;
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

const renderButtons = () => {
  const backButton = document.createElement('button');
  backButton.title = 'Previous day';
  backButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>';

  backButton.addEventListener('click', (e) => {
    console.log(e);
  });

  const forwardButton = document.createElement('button');
  forwardButton.title = 'Next day';
  forwardButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>';

  forwardButton.addEventListener('click', (e) => {
    console.log(e);
  });

  return { backButton, forwardButton };
};

export const generateCalendar = async () => {
  const today = new Date();

  const timelineElement = document.getElementById('timeline');
  const eventListElement = document.getElementById('event-list');
  const timelineActions = document.getElementById('timeline-actions');

  const todayLabel = renderTodayLabel();
  timelineActions.appendChild(todayLabel);

  // TODO - not sure if we want this functionality
  // const { backButton, forwardButton } = renderButtons(today);
  // timelineActions.appendChild(backButton);
  // timelineActions.appendChild(forwardButton);

  const xAxisElement = document.createElement('div');
  xAxisElement.className = 'x-axis';
  timelineElement.appendChild(xAxisElement);

  for (let hour = 9; hour <= 17; hour++) {
    const tickElement = renderTick(hour);
    xAxisElement.appendChild(tickElement);
  }

  const nowTickElement = renderNowTick();
  xAxisElement.appendChild(nowTickElement);

  const events = await getEvents(today);
  console.log(events);

  // only render events from 9 to 5
  const eventsToRender = events.filter((e) => {
    const startTime = new Date(e.start.dateTime);
    const endTime = new Date(e.end.dateTime);
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    return !(endHour < 9 || startHour > 17);
  });

  // pills
  eventsToRender.forEach((event, i) => {
    const previousEndTime = events[i - 1]?.end.dateTime ?? null;

    const eventElement = renderEventPill(
      event,
      i,
      timelineElement.clientWidth,
      previousEndTime
    );

    timelineElement.appendChild(eventElement);
  });

  // list
  const futureEvents = eventsToRender.filter(
    (e) => new Date(e.start.dateTime) >= today
  );

  futureEvents.forEach((event) => {
    const eventListItem = document.createElement('div');
    eventListItem.className = 'event-list-item';
    eventListItem.title = 'Open in Google Calendar';
    eventListItem.innerHTML = `
      <span>${event.summary}</span>
      <span>${formatTime(event.start.dateTime, false)} - ${formatTime(
      event.end.dateTime
    )}</span>
    `;

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
};
