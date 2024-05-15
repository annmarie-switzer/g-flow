import { markAs, moveToTrash } from './api.js';
import { generateList } from './threads.js';

const actionButton = (details) => {
  const btn = document.createElement('button');

  fetch(`icons/${details.icon}.svg`)
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
      action: () => markAs(messageId, 'unread').then(generateList),
      title: 'Mark unread'
    })
  );

  return row;
};

export const generateMessage = (messageData) => {
  const { id, received, sender, snippet, subject, body } = messageData;

  const messageContainer = document.getElementById('message-container');

  messageContainer.appendChild(actionButtonRow(id));

  const messageBodyContainer = document.createElement('div');
  messageBodyContainer.className = 'message-body-container';
  messageBodyContainer.innerHTML = `
    <div class="metadata">
      <span class="subject">${subject}</span>
      <span class="sender">${sender}</span>
    </div>
    
    <div class="message-body">${body}</div>
  `;

  messageContainer.appendChild(messageBodyContainer);
};
