import { generateMessage } from './message.js';
import { markRead, moveToTrash } from './actions.js';

const listContainer = document.getElementById('list-container');
const messageContainer = document.getElementById('message-container');

listContainer.style.display = 'flex';
messageContainer.style.display = 'none';

const onListItemClick = (id, data) => {
  generateMessage(id, data);
  listContainer.style.display = 'none';
  messageContainer.style.display = 'flex';

  markRead(id);
};

const generateListItem = (messageId, messageData) => {
  const { sender, subject, snippet } = messageData;

  const listItem = document.createElement('div');
  listItem.className = 'list-item';
  listItem.addEventListener('click', () =>
    onListItemClick(messageId, messageData)
  );

  listItem.innerHTML = `
    <div class="sender">${sender}</div>
    <div class="subject">${subject}</div>
    <div class="snippet">${snippet} ...</div>
  `;

  const btn = document.createElement('button');

  fetch('img/delete.svg')
    .then((response) => response.text())
    .then((svgContent) => {
      btn.innerHTML = svgContent;
    });

  btn.title = 'Move to trash';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    moveToTrash(messageId);
  });

  listItem.appendChild(btn);

  return listItem;
};

export const generateList = () => {
  chrome.storage.session.get(['unreadMessages'], (result) => {
    const messages = result.unreadMessages;
    console.log('MESSAGES => ', Object.keys(messages).length);
    const listItems = Object.entries(messages).map(([id, data]) =>
      generateListItem(id, data)
    );
    listContainer.innerHTML = '';
    listContainer.append(...listItems);
  });
};

generateList();
