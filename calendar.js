import { getEvents } from './api.js';

const datetimeToPosition = (dateTime, width, previousEndTime) => {
  const date = new Date(dateTime);
  const totalMinutes = (date.getHours() - 9) * 60 + date.getMinutes();
  return (totalMinutes / (8 * 60)) * width;
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

  let now = new Date();
  // TODO - remove
  // if (now.getHours() > 17) {
  //   now.setHours(14, 35, 0, 0);
  // }
  now.setHours(14, 35, 0, 0);

  // This is tomorrow
  now.setDate(now.getDate() + 1);

  let eventStart = new Date(event.start.dateTime);
  let eventEnd = new Date(event.end.dateTime);

  if (now >= eventStart && now <= eventEnd) {
    eventElement.classList.add('now');
  }

  if (previousEndTime !== null && event.start.dateTime <= previousEndTime) {
    eventElement.style.transform = `translateY(${pillHeight * index - 8}px)`;
  }

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
  // let hour = new Date().getHours();
  // let minute = new Date().getMinutes();

  // // TODO - remove
  // if (hour > 17) {
  //   hour = 14;
  //   minute = 35;
  // }

  const hour = 14;
  const minute = 35;

  const tickElement = document.createElement('div');
  tickElement.className = 'tick now';
  tickElement.style.left = `${(((hour - 9) * 60 + minute) / (8 * 60)) * 100}%`;
  return tickElement;
};

export const generateCalendar = async () => {
  const timelineElement = document.getElementById('timeline');
  const eventListElement = document.getElementById('event-list');
  const timelineActions = document.getElementById('timeline-actions');

  const todayLabel = document.createElement('span');
  const today = new Date();
  todayLabel.textContent = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  timelineActions.appendChild(todayLabel);

  const backButton = document.createElement('button');
  backButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>';

  backButton.addEventListener('click', (e) => {
    console.log(e);
  });

  const forwardButton = document.createElement('button');
  forwardButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>';

  forwardButton.addEventListener('click', (e) => {
    console.log(e);
  });

  timelineActions.appendChild(backButton);
  timelineActions.appendChild(forwardButton);

  const xAxisElement = document.createElement('div');
  xAxisElement.className = 'x-axis';

  timelineElement.appendChild(xAxisElement);

  for (let hour = 9; hour <= 17; hour++) {
    const tickElement = renderTick(hour);
    xAxisElement.appendChild(tickElement);
  }

  const nowTickElement = renderNowTick();
  xAxisElement.appendChild(nowTickElement);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const events = await getEvents(tomorrow);
  console.log(events);

  events.forEach((event, i) => {
    if (event.status === 'cancelled') {
      return null;
    }

    // event pills
    const previousEndTime = events[i - 1]?.end.dateTime ?? null;

    const eventElement = renderEventPill(
      event,
      i,
      timelineElement.clientWidth,
      previousEndTime
    );

    timelineElement.appendChild(eventElement);

    // event list
    // TODO - don't show past events
    const eventListItem = document.createElement('div');
    eventListItem.className = 'event-list-item';
    eventListItem.innerHTML = `
      <span>${event.summary}</span>
      <span>
        ${event.start.dateTime.slice(11, 16)} - ${event.end.dateTime.slice(
      11,
      16
    )}
      </span>
    `;
    eventListElement.appendChild(eventListItem);
  });

  if (events.length === 0) {
    const noEvents = document.createElement('div');
    noEvents.className = 'no-events';
    noEvents.innerHTML = `
      <div class="no-events">No events today</div>
    `;

    eventListElement.appendChild(noEvents);
  }
};
