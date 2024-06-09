import { markAs, moveToTrash } from '../api.js';
import { actionButtonRow } from '../threads/action-button-row.js';
import { generateThreadList } from '../threads/threads.js';

export const renderMessages = (messages) => {
  const messagesContainer = document.getElementById('messages-container');

  const actionRow = actionButtonRow([
    {
      icon: 'back',
      action: generateThreadList,
      title: 'Go back'
    },
    {
      icon: 'delete',
      action: () => moveToTrash(id).then(generateThreadList),
      title: 'Move to trash'
    },
    {
      icon: 'mark-unread',
      action: () => markAs(id, 'unread').then(generateThreadList),
      title: 'Mark unread'
    }
  ]);

  messagesContainer.appendChild(actionRow);

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

  messagesContainer.appendChild(messageHeader);

  messages.reverse().forEach((messageData) => {
    const { body } = messageData;

    const message = document.createElement('div');
    message.className = 'message';
    message.innerHTML = `<div class="body">${body}</div>`;

    messagesContainer.appendChild(message);
  });
};
