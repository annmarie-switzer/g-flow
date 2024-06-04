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
      action: () =>
        markAs(id, 'unread').then(getUnreadThreads).then(generateList),
      title: 'Mark unread'
    }
  ]);

  messageContainer.appendChild(actionRow);

  const mostRecentMessage = messages[messages.length - 1];
  const { id, sender, subject } = mostRecentMessage;

  const messageHeader = document.createElement('div');
  messageHeader.className = 'data';
  messageHeader.innerHTML = `
    <div>
      <span class="subject">${subject}</span>
      <span class="sender">${sender}</span>
    </div>
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

  listItem.innerHTML = `
    <div class="data">
      <div>
        <div class="subject">${subject}</div>
        <div class="sender">${sender}</div>
      </div>
      <div class="received">${received}</div>
    </div>
    <div class="snippet">${snippet}</div>
  `;

  const deleteButton = document.createElement('button');
  deleteButton.title = 'Move to trash';

  deleteButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>';

  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();

    deleteButton.innerHTML =
      '<svg class="spinner" viewBox="0 0 50 50" height="18" width="18"><circle cx="25" cy="25" r="20"></circle></svg>';

    moveToTrash(thread.id).then(generateList);
  });

  const receivedDiv = listItem.querySelector('.received');
  receivedDiv.appendChild(deleteButton);

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
