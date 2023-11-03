import { markUnread, moveToTrash, resetView } from './actions.js';

// text, action
export const actionButton = (details) => {
  const btn = document.createElement('button');
  btn.textContent = details.text;
  btn.addEventListener('click', () => {
    details.action();
  });

  return btn;
};

export const actionButtonRow = (messageId) => {
  const row = document.createElement('div');
  row.className = 'action-row';
  row.appendChild(
    actionButton({
      text: 'Move to trash',
      action: () => moveToTrash(messageId)
    })
  );
  row.appendChild(
    actionButton({
      text: 'Mark unread',
      action: () => markUnread(messageId)
    })
  );
  return row;
};

export const generateMessage = (messageId, messageData) => {
  const { sender, subject, body } = messageData;

  const message = document.createElement('div');
  message.className = 'message';

  message.appendChild(actionButton({ text: 'Go back', action: resetView }));
  message.appendChild(actionButtonRow(messageId));

  const messageContent = document.createElement('div');
  messageContent.innerHTML = `
    <h3>${subject}</h3>
    <h4>${sender}</h4>
    <p>${body}</p>
  `;
  message.appendChild(messageContent);

  return message;
};
