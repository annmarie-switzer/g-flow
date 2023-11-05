import { markUnread, moveToTrash, resetView } from './actions.js';

// text, action
export const actionButton = (details) => {
  const btn = document.createElement('button');

  fetch(`img/${details.icon}.svg`)
    .then((response) => response.text())
    .then((svgContent) => {
      btn.innerHTML = svgContent;
      btn.appendChild(icon);
    });

  btn.title = details.title;

  btn.addEventListener('click', () => {
    details.action();
  });

  Object.assign(btn.style, details.style);

  return btn;
};

export const actionButtonRow = (messageId) => {
  const row = document.createElement('div');
  row.className = 'action-row';
  row.appendChild(
    actionButton({
      icon: 'back',
      action: resetView,
      title: 'Go back'
      // style: { backgroundColor: 'blue' }
    })
  );
  row.appendChild(
    actionButton({
      icon: 'delete',
      action: () => moveToTrash(messageId),
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

export const generateMessage = (messageId, messageData) => {
  const { sender, subject, body } = messageData;

  const messageContainer = document.getElementById('message-container');

  messageContainer.appendChild(actionButtonRow(messageId));

  const messageBody = document.createElement('div');
  messageBody.className = 'message-body';
  messageBody.innerHTML = `
    <div>${subject}</div>
    <div>${sender}</div>
    <div>${body}</div>
  `;

  messageContainer.appendChild(messageBody);
};
