import { getUnreadThreads } from '../background.js';
import { actionButtonRow } from '../utils/action-button-row.js';
import { getEmail, markAs, moveToTrash } from '../utils/api.js';
import { generateCalendar } from '../views/calendar.js';

const popupContainer = document.getElementById('popup-container');
const listContainer = document.getElementById('list-container');
const messageContainer = document.getElementById('message-container');

const generateMessages = (messages) => {
  const messageContainer = document.getElementById('message-container');

  const actionRow = actionButtonRow([
    {
      icon: 'back',
      action: generateList,
      title: 'Go back'
    },
    {
      icon: 'delete',
      action: () => moveToTrash(id).then(generateList),
      title: 'Move to trash'
    },
    {
      icon: 'mark-unread',
      action: () => markAs(id, 'unread').then(generateList),
      title: 'Mark unread'
    }
  ]);

  messageContainer.appendChild(actionRow);

  const mostRecentMessage = messages[messages.length - 1];
  const { id, sender, subject } = mostRecentMessage;

  const messageHeader = document.createElement('div');
  messageHeader.className = 'data';
  messageHeader.innerHTML = `
    <span class="subject">${subject}</span>
    <span class="sender">${sender}</span>
  `;

  messageContainer.appendChild(messageHeader);

  messages.reverse().forEach((messageData) => {
    const { body } = messageData;

    const message = document.createElement('div');
    message.className = 'message';
    message.innerHTML = `<div class="body">${body}</div>`;

    messageContainer.appendChild(message);
  });
};

const onListItemClick = (thread) => {
  generateMessages(thread.messages);

  popupContainer.style.display = 'none';
  messageContainer.style.display = 'flex';

  markAs(thread.id, 'read');
};

const generateListItem = (thread) => {
  const latestMessage = thread.messages[thread.messages.length - 1];
  const { received, sender, subject, snippet } = latestMessage;

  const listItem = document.createElement('div');
  listItem.className = 'list-item';
  listItem.title = snippet;

  listItem.innerHTML = `
    <div class="data">
      <div class="subject">${subject}</div>
      <div class="sender">${sender}</div>
    </div>
    <div class="received">${received}</div>
  `;

  listItem.addEventListener('click', () => onListItemClick(thread));

  return listItem;
};

const generateActionsRow = async () => {
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

  return actionButtonRow(buttons);
};

export const generateList = async () => {
  popupContainer.style.display = 'flex';
  messageContainer.style.display = 'none';
  listContainer.innerHTML = '';

  const actionsRow = await generateActionsRow();
  listContainer.appendChild(actionsRow);

  const { unreadThreads } = await chrome.storage.session.get(['unreadThreads']);

  if (unreadThreads.length) {
    const listItems = unreadThreads.map(generateListItem);
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
