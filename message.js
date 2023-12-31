import { markUnread, moveToTrash } from './api.js';
import { generateList } from './popup.js';

const actionButton = (details) => {
  const btn = document.createElement('button');

  fetch(`img/${details.icon}.svg`)
    .then((response) => response.text())
    .then((svgContent) => {
      btn.innerHTML = svgContent;
    });

  btn.title = details.title;

  btn.addEventListener('click', () => {
    details.action();
  });

  return btn;
};

const actionButtonRow = (messageId) => {
  const row = document.createElement('div');
  row.className = 'action-row';

  row.appendChild(
    actionButton({
      icon: 'back',
      action: generateList,
      title: 'Go back'
    })
  );

  row.appendChild(
    actionButton({
      icon: 'delete',
      action: () => moveToTrash(messageId).then(generateList),
      title: 'Move to trash'
    })
  );

  row.appendChild(
    actionButton({
      icon: 'mark-unread',
      action: () => markUnread(messageId),
      title: 'Mark unread'
    })
  );

  return row;
};

export const generateMessage = (messageData) => {
  const { id, received, sender, subject, body } = messageData;

  const messageContainer = document.getElementById('message-container');

  messageContainer.appendChild(actionButtonRow(id));

  const messageBody = document.createElement('div');
  messageBody.className = 'message-body';
  messageBody.innerHTML = `
    <div class="sender">${sender}</div>
    <div class="subject">${subject}</div>
    <div>${body}</div>
  `;

  messageContainer.appendChild(messageBody);
};
