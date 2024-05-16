import { actionButtonRow } from './action-button-row.js';
import { getEmail, markAs } from './api.js';
import { getUnreadThreads } from './background.js';
import { generateCalendar } from './calendar.js';
import { generateMessage } from './message.js';

const popupContainer = document.getElementById('popup-container');
const listContainer = document.getElementById('list-container');
const messageContainer = document.getElementById('message-container');

const onListItemClick = (message) => {
  generateMessage(message);

  popupContainer.style.display = 'none';
  messageContainer.style.display = 'flex';

  markAs(message.id, 'read');
};

const generateListItem = (messageData) => {
  const { id, received, sender, subject, snippet } = messageData;

  const listItem = document.createElement('div');
  listItem.className = 'list-item';
  listItem.addEventListener('click', () => onListItemClick(messageData));

  listItem.innerHTML = `
    <div class="data">
      <div class="subject">${subject}</div>
      <div class="sender">${sender}</div>
    </div>
    <div class="received">${received}</div>
  `;

  return listItem;
};

export const generateList = async () => {
  popupContainer.style.display = 'flex';
  messageContainer.style.display = 'none';

  const { unreadThreads } = await chrome.storage.session.get(['unreadThreads']);

  const buttons = [
    {
      icon: 'refresh',
      action: () =>
        getUnreadThreads().then(() => {
          generateList();
          generateCalendar('today');
        }),
      title: 'Refresh'
    },
    {
      text: await getEmail(),
      icon: 'forward-to-inbox',
      action: () => window.open('https://mail.google.com/', '_blank'),
      title: 'Go to your inbox'
    }
  ];

  const actionsRow = actionButtonRow(buttons);

  listContainer.innerHTML = '';
  listContainer.appendChild(actionsRow);

  if (unreadThreads.length) {
    // TODO
    const messages = unreadThreads.map((thread) => thread.messages).flat();
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
