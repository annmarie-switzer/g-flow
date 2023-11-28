import { getEmail, getEvents, markRead, moveToTrash } from './api.js';
import { generateMessage } from './message.js';

const listContainer = document.getElementById('list-container');
const messageContainer = document.getElementById('message-container');

const formatReceived = (received) => {
  const date = new Date(parseInt(received));
  const today = new Date();
  const userLocale = navigator.language || 'en-US';

  if (date.toLocaleDateString() === today.toLocaleDateString()) {
    return new Intl.DateTimeFormat(userLocale, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  } else {
    return new Intl.DateTimeFormat(userLocale, {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
};

const onListItemClick = (message) => {
  generateMessage(message);

  listContainer.style.display = 'none';
  messageContainer.style.display = 'flex';

  markRead(message.id);
};

const generateListItem = (messageData) => {
  const { id, received, sender, subject, snippet } = messageData;

  const listItem = document.createElement('div');
  listItem.className = 'list-item';
  listItem.addEventListener('click', () => onListItemClick(messageData));

  listItem.innerHTML = `
    <div class="sender">
      <span>${sender}</span>
      <span>${formatReceived(received)}</span>
    </div>
    <div class="subject">${subject}</div>
    <div class="snippet">${snippet} ...</div>
  `;

  const btn = document.createElement('button');

  fetch('img/delete.svg')
    .then((response) => response.text())
    .then((svgContent) => {
      btn.innerHTML = svgContent;
    });

  btn.title = 'Move to trash';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    moveToTrash(id).then(generateList);
  });

  listItem.appendChild(btn);

  return listItem;
};

export const generateList = async () => {
  listContainer.style.display = 'flex';
  messageContainer.style.display = 'none';

  const result = await chrome.storage.session.get(['unreadMessages']);
  const messages = result.unreadMessages;

  const row = document.querySelector('.action-row');

  const email = await getEmail();
  const emailButton = document.createElement('button');
  emailButton.className = 'square';

  const response = await fetch('img/forward-to-inbox.svg');
  const svgContent = await response.text();
  emailButton.innerHTML = `${svgContent}<span>${email}</span>`;

  emailButton.addEventListener('click', () => {
    window.open('https://mail.google.com/', '_blank');
  });

  emailButton.title = 'Go to your inbox';

  row.appendChild(emailButton);

  listContainer.innerHTML = '';
  listContainer.appendChild(row);

  if (messages) {
    const listItems = messages.map(generateListItem);
    listContainer.append(...listItems);
  } else {
    const noMessages = document.createElement('div');
    noMessages.className = 'no-messages';
    noMessages.innerHTML = `
      <div class="no-messages">No unread messages</div>
    `;

    listContainer.appendChild(noMessages);
  }

  messageContainer.innerHTML = '';
  messageContainer.style.display = 'none';
  listContainer.style.display = 'flex';
};

const generateCalendar = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate());

  const events = await getEvents(tomorrow);
  console.log(events);

  const timelineElement = document.getElementById('timeline');

  // Render X-axis with tick marks and labels from 9am to 5pm
  const xAxisElement = document.createElement('div');
  xAxisElement.className = 'x-axis';

  for (let hour = 9; hour <= 17; hour++) {
    const tickElement = document.createElement('div');
    tickElement.className = 'tick';
    tickElement.style.left = `${((hour - 9) / 8) * 100}%`;

    const tickLabelElement = document.createElement('div');
    tickLabelElement.className = 'tick-label';
    tickLabelElement.textContent = hour % 12 === 0 ? '12' : hour % 12; // Format hour labels (12-hour format)

    tickElement.appendChild(tickLabelElement);
    xAxisElement.appendChild(tickElement);
  }

  timelineElement.appendChild(xAxisElement);

  // Function to convert datetime to pixel position
  function datetimeToPosition(dateTime, timeZone) {
    const date = new Date(dateTime);
    const options = { timeZone: timeZone };
    const totalMinutes = (date.getHours() - 9) * 60 + date.getMinutes();
    return (totalMinutes / (8 * 60)) * timelineElement.clientWidth;
  }

  // Render events on the timeline
  events.forEach((event) => {
    const startPixel = datetimeToPosition(
      event.start.dateTime,
      event.start.timeZone
    );
    const endPixel = datetimeToPosition(event.end.dateTime, event.end.timeZone);

    const eventElement = document.createElement('div');
    eventElement.className = 'event';
    eventElement.style.left = `${startPixel}px`;
    eventElement.style.width = `${endPixel - startPixel}px`;

    timelineElement.appendChild(eventElement);
  });
};

chrome.runtime.sendMessage({ action: 'getAccessToken' }, (res) => {
  if (!chrome.runtime.lastError && res.token) {
    generateList();
    generateCalendar();
  } else {
    console.error('Error getting access token: ', chrome.runtime.lastError);
  }
});
