import { getEmail, markRead, moveToTrash } from './api.js';
import { getMessages } from './background.js';
import { generateCalendar } from './calendar.js';
import { formatReceived } from './formatters.js';
import { generateMessage } from './message.js';

const popupContainer = document.getElementById('popup-container');
const listContainer = document.getElementById('list-container');
const messageContainer = document.getElementById('message-container');

const trashIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>';

const spinnerIcon =
  '<svg class="spinner" viewBox="0 0 50 50" height="18" width="18"><circle cx="25" cy="25" r="20"></circle></svg>';

const onListItemClick = (message) => {
  generateMessage(message);

  popupContainer.style.display = 'none';
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
  btn.innerHTML = trashIcon;

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    btn.innerHTML = spinnerIcon;
    await moveToTrash(id);
    generateList();
  });

  const btnContainer = document.createElement('div');
  btnContainer.className = 'btn-container';
  btnContainer.appendChild(btn);
  listItem.appendChild(btnContainer);

  listItem.insertAdjacentHTML(
    'beforeend',
    `
      <div class="data">
        <div class="subject">${subject}</div>
        <div class="sender">${sender}</div>
      </div>
      <div class="received">${formatReceived(received)}</div>
  `
  );

  return listItem;
};

const renderRefreshButton = async () => {
  const refreshButton = document.createElement('button');

  const response = await fetch('icons/refresh.svg');
  const svgContent = await response.text();

  refreshButton.innerHTML = svgContent;
  refreshButton.title = 'Refresh';

  refreshButton.addEventListener('click', () => {
    getMessages().then(() => {
      generateList();
      generateCalendar('today');
    });
  });

  return refreshButton;
};

const renderEmailButton = async () => {
  const email = await getEmail();
  const emailButton = document.createElement('button');

  const response = await fetch('icons/forward-to-inbox.svg');
  const svgContent = await response.text();
  emailButton.innerHTML = `${svgContent}<span>${email}</span>`;
  emailButton.title = 'Go to your inbox';

  emailButton.addEventListener('click', () => {
    window.open('https://mail.google.com/', '_blank');
  });

  return emailButton;
};

export const generateList = async () => {
  popupContainer.style.display = 'flex';
  messageContainer.style.display = 'none';

  const result = await chrome.storage.session.get(['unreadMessages']);
  const messages = result.unreadMessages;

  const row = document.createElement('div');
  row.className = 'action-row';

  const refreshButton = await renderRefreshButton();
  row.appendChild(refreshButton);

  const emailButton = await renderEmailButton();
  row.appendChild(emailButton);

  listContainer.innerHTML = '';
  listContainer.appendChild(row);

  if (messages.length) {
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
  popupContainer.style.display = 'flex';
};
