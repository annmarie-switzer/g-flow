import { generateMessage } from './message.js';
import { markRead, moveToTrash } from './actions.js';

const listContainer = document.getElementById('list-container');
const messageContainer = document.getElementById('message-container');

listContainer.style.display = 'flex';
messageContainer.style.display = 'none';

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
    moveToTrash(id);
  });

  listItem.appendChild(btn);

  return listItem;
};

export const generateList = () => {
  chrome.storage.session.get(['unreadMessages'], (result) => {
    const messages = result.unreadMessages;
    const listItems = messages
      // .sort((a, b) => b.internalDate - a.internalDate)
      .map(generateListItem);

    listContainer.innerHTML = '';
    listContainer.append(...listItems);
  });
};

generateList();
