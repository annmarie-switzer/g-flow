import { getEmail, markRead, moveToTrash } from './api.js';
import { generateMessage } from './message.js';
import { generateCalendar } from './calendar.js';

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

  const btn = document.createElement('button');
  btn.title = 'Move to trash';
  btn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    moveToTrash(id).then(generateList);
  });

  const btnContainer = document.createElement('div');
  btnContainer.className = 'btn-container';
  btnContainer.appendChild(btn);
  listItem.appendChild(btnContainer);

  listItem.insertAdjacentHTML(
    'beforeend',
    `<div class="data">
    <div class="first-row">
      <div class="subject">${subject}</div>
      <div class="received">${formatReceived(received)}</div>
    </div>
    <div class="sender">${sender}</div>
  </div>
  `
  );

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

chrome.runtime.sendMessage({ action: 'getAccessToken' }, (res) => {
  if (!chrome.runtime.lastError && res.token) {
    generateList();
    generateCalendar();
  } else {
    console.error('Error getting access token: ', chrome.runtime.lastError);
  }
});
