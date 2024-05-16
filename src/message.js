import { actionButtonRow } from './action-button-row.js';
import { markAs, moveToTrash } from './api.js';
import { generateList } from './threads.js';

export const generateMessage = (messageData) => {
  const { id, received, sender, snippet, subject, body } = messageData;

  const messageContainer = document.getElementById('message-container');

  const buttons = [
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
  ];

  messageContainer.appendChild(actionButtonRow(buttons));

  const messageBodyContainer = document.createElement('div');
  messageBodyContainer.className = 'message-body-container';
  messageBodyContainer.innerHTML = `
    <div class="list-item">
      <div class="data">
        <span class="subject">${subject}</span>
        <span class="sender">${sender}</span>
      </div>
      <div class="received">${received}</div>
    </div>
    
    <div class="message-body">${body}</div>
  `;

  messageContainer.appendChild(messageBodyContainer);
};
