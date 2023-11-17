import { generateMessage } from './message.js';
import { markRead, moveToTrash } from './actions.js';

const listContainer = document.getElementById('list-container');
const messageContainer = document.getElementById('message-container');

listContainer.style.display = 'flex';
messageContainer.style.display = 'none';

const getEmail = async () => {
  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    { headers }
  );

  const { emailAddress } = await res.json();
  return emailAddress;
};

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
  const email = await getEmail();

  const result = await chrome.storage.session.get(['unreadMessages']);
  const messages = result.unreadMessages;

  const row = document.createElement('div');
  row.className = 'action-row';

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
  }
  // TODO - empty list

  messageContainer.innerHTML = '';
  messageContainer.style.display = 'none';
  listContainer.style.display = 'flex';
};

generateList();
