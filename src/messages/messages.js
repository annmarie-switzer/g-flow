import { markAsUnread, moveToTrash } from '../api.js';
import { actionButtonRow } from '../shared/action-button-row.js';
import { backIcon, deleteIcon, markUnreadIcon } from '../shared/index.js';
import { generateThreadList } from '../threads/threads.js';

export const renderMessages = (threadId, messages) => {
  const messagesContainer = document.getElementById('messages-container');

  const mostRecentMessage = messages[messages.length - 1];
  const { id: mostRecentMessageId, sender, subject } = mostRecentMessage;

  const actionRow = actionButtonRow([
    {
      icon: backIcon,
      action: generateThreadList,
      title: 'Go back'
    },
    {
      icon: deleteIcon,
      action: () => moveToTrash(threadId).then(generateThreadList),
      title: 'Move to trash',
      spinner: true
    },
    {
      icon: markUnreadIcon,
      action: () => markAsUnread(mostRecentMessageId).then(generateThreadList),
      title: 'Mark unread',
      spinner: true
    }
  ]);

  messagesContainer.appendChild(actionRow);

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
