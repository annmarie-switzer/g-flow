import { generateMessage } from './message.js';
import { markRead } from './actions.js';

const listContainer = document.getElementById('list-container');
const messageContainer = document.getElementById('message-container');

listContainer.style.display = 'block';
messageContainer.style.display = 'none';

const onListItemClick = (id, data) => {
  // Populate the message view and hide the list view
  const message = generateMessage(id, data);
  messageContainer.appendChild(message);
  listContainer.style.display = 'none';
  messageContainer.style.display = 'block';

  // Mark message as "read"
  chrome.runtime.sendMessage({ action: 'getAccessToken' }, (response) => {
    markRead(id, response.token).then((res) => {
      // Reset unread messsage list
      chrome.runtime.sendMessage({ action: 'fetchUnreadMessages' });
    });
  });
};

const generateListItem = (messageId, messageData) => {
  const { sender, subject, snippet } = messageData;

  const listItem = document.createElement('li');
  listItem.className = 'list-item';
  listItem.addEventListener('click', () =>
    onListItemClick(messageId, messageData)
  );

  listItem.innerHTML = `
    <h3>${subject}</h3>
    <h4>${sender}</h4>
    <p>${snippet}</p>
  `;

  return listItem;
};

export const generateList = () => {
  chrome.storage.session.get(['unreadMessages'], (result) => {
    const messages = result.unreadMessages;
    const listItems = Object.entries(messages).map(([id, data]) =>
      generateListItem(id, data)
    );
    listContainer.innerHTML = '';
    listContainer.append(...listItems);
  });
};

generateList();
