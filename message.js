import { generateList } from './popup.js';
import { actionButton, actionButtonRow } from './shared.js';

const resetView = () => {
  const listContainer = document.getElementById('list-container');
  const messageContainer = document.getElementById('message-container');

  messageContainer.innerHTML = '';
  messageContainer.style.display = 'none';

  generateList();
  listContainer.style.display = 'block';
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
