import { getEvents } from '../utils/api.js';

const isEndTimeNextDay = (eventStart, eventEnd) => {
  const start = new Date(eventStart.getTime());
  const end = new Date(eventEnd.getTime());

  // Set the hours, minutes, seconds, and milliseconds to 0 to compare only the date part
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Add 1 to the date part of the start date
  start.setDate(start.getDate() + 1);

  // Compare the time part of the start and end dates
  return start.getTime() === end.getTime();
};

const datetimeToPosition = (dateTime) => {
  const date = new Date(dateTime);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();

  const xAxisElement = document.querySelector('.x-axis');
  const xAxisWidth = xAxisElement.scrollWidth;

  return (totalMinutes / (24 * 60)) * xAxisWidth;
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

const isTentative = (event) => {
  const STATUSES = ['needsAction', 'tentative'];

  const { attendees, creator, status } = event;
  const eventTentative = STATUSES.includes(status);

  if (!attendees) return eventTentative;

  const { responseStatus } = attendees.find((attendee) => attendee.self);
  const isCreator = creator.self;
  const userTentative = !isCreator && STATUSES.includes(responseStatus);

  return userTentative || eventTentative;
};

const allDeclined = (attendees) => {
  if (!attendees) return false;

  const numDeclined = attendees.filter(
    (attendee) => attendee.responseStatus === 'declined'
  ).length;

  return numDeclined >= attendees.length - 1;
};

const userDeclined = (event) => {
  const { attendees, creator } = event;

  if (!attendees) return false;

  const { responseStatus } = attendees.find((attendee) => attendee.self);
  const isCreator = creator.self;

  return !isCreator && responseStatus === 'declined';
};

const renderEventPill = (event, previousEndTime) => {
  const pillHeight = 8;

  let eventStart;
  let eventEnd;

  const isAllDay =
    event.start.date &&
    event.end.date &&
    !event.start.dateTime &&
    !event.end.dateTime;

  if (isAllDay) {
    eventStart = new Date().setHours(0, 0, 0, 0);
    eventEnd = new Date().setHours(23, 59, 0, 0);
  } else {
    eventStart = new Date(event.start.dateTime);
    eventEnd = new Date(event.end.dateTime);

    // If event is going to bleed into the next day, artificially set end time to 11:59pm
    if (isEndTimeNextDay(eventStart, eventEnd)) {
      eventEnd.setHours(23);
      eventEnd.setMinutes(59);
    }
  }

  const startPixel = datetimeToPosition(eventStart);
  const endPixel = datetimeToPosition(eventEnd);

  const eventElement = document.createElement('div');
  eventElement.className = 'event';
  eventElement.style.left = `${startPixel}px`;
  eventElement.style.width = `${endPixel - startPixel}px`;
  eventElement.style.height = `${pillHeight}px`;
  eventElement.dataset.id = event.id;

  const now = new Date();

  if (now >= eventStart && now <= eventEnd) {
    eventElement.classList.add('now');
  }

  if (eventEnd < now) {
    eventElement.classList.add('past');
  }

  if (isAllDay) {
    eventElement.classList.remove('now');
    eventElement.classList.add('all-day');
    eventElement.style.height = `${pillHeight / 2}px`;
    eventElement.style.bottom = `${pillHeight}`;
  }

  if (isTentative(event) || allDeclined(event.attendees)) {
    eventElement.classList.add('tentative');
  }

  if (previousEndTime !== null && event.start.dateTime < previousEndTime) {
    eventElement.style.transform = `translateY(${pillHeight}px)`;
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

const renderDateLabel = (currentDate) => {
  const dateLabel = document.createElement('span');
  dateLabel.id = 'date-label';
  dateLabel.textContent = currentDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  return dateLabel;
};

/** @param day 'today' | 'tomorrow' */
export const generateCalendar = async (day) => {
  const timelineActionsElement = document.getElementById('timeline-actions');
  const timelineElement = document.getElementById('timeline');
  const eventListElement = document.getElementById('event-list');

  timelineActionsElement.innerHTML = '';
  timelineElement.innerHTML = '';
  eventListElement.innerHTML = '';

  const today = new Date();
  const currentDate =
    day === 'today' ? today : new Date(today.setDate(today.getDate() + 1));

  const dateLabel = renderDateLabel(currentDate);
  timelineActionsElement.appendChild(dateLabel);

  const dateToggle = document.createElement('button');
  dateToggle.id = 'date-toggle';
  dateToggle.textContent = day === 'today' ? 'See Tomorrow' : 'See Today';

  dateToggle.addEventListener('click', () => {
    day = day === 'today' ? 'tomorrow' : 'today';
    generateCalendar(day);
  });

  timelineActionsElement.appendChild(dateToggle);

  const xAxisElement = document.createElement('div');
  xAxisElement.className = 'x-axis';
  timelineElement.appendChild(xAxisElement);

  for (let hour = 0; hour <= 24; hour++) {
    const tickElement = renderTick(hour);
    xAxisElement.appendChild(tickElement);
  }

  if (day === 'today') {
    const nowTickElement = renderNowTick();
    xAxisElement.appendChild(nowTickElement);
  }

  const allEvents = await getEvents(currentDate);
  const events = allEvents.filter((event) => !userDeclined(event));

  // pills
  events.forEach((event, i) => {
    const previousEndTime = events[i - 1]?.end.dateTime ?? null;
    const eventElement = renderEventPill(event, previousEndTime);
    timelineElement.appendChild(eventElement);
  });

  // list
  const now = new Date(currentDate);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const listEvents = events
    .map((e) => {
      const isFutureEvent = (() => {
        const eventStart = new Date(e.start.dateTime);
        const eventEnd = new Date(e.end.dateTime);
        return (
          (eventStart >= now && eventStart < tomorrow) ||
          (eventEnd > now && eventStart < tomorrow)
        );
      })();

      const isAllDayEvent = !!(
        e.start.date &&
        e.end.date &&
        !e.start.dateTime &&
        !e.end.dateTime
      );

      return { ...e, isFutureEvent, isAllDayEvent };
    })
    .filter((e) => e.isFutureEvent || e.isAllDayEvent);

  listEvents.forEach((event) => {
    const eventListItem = document.createElement('div');
    eventListItem.className = 'event-list-item';
    eventListItem.title = 'Open in Google Calendar';
    eventListItem.dataset.id = event.id;

    if (event.isAllDayEvent) {
      eventListItem.classList.add('all-day');
      eventListItem.innerHTML = `
        <span>${event.summary}</span>
        <span>All day</span>
      `;
    } else {
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
    }

    eventListItem.addEventListener('click', () => {
      window.open(event.htmlLink, '_blank');
    });

    eventListElement.appendChild(eventListItem);
  });

  if (listEvents.length === 0) {
    const noEvents = document.createElement('div');
    noEvents.className = 'no-events';
    noEvents.textContent = 'No more events today';
    eventListElement.appendChild(noEvents);
  }

  // scroll the chart to 2 hours before the current time
  const twoHoursBefore = new Date();
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
  twoHoursBefore.setMinutes(0);

  timelineElement.scrollLeft = datetimeToPosition(twoHoursBefore);

  // Add event listeners to the event pills and list items
  document.querySelectorAll('.event, .event-list-item').forEach((element) => {
    const { id } = element.dataset;

    element.addEventListener('mouseover', () => {
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
