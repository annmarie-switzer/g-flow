import { getEmail, markAs, moveToTrash } from '../api.js';
import { deleteIcon, forwardToInboxIcon, refreshIcon } from '../icons/index.js';
import { renderMessages } from '../messages/messages.js';
import { actionButtonRow, generateButton } from '../shared/index.js';
import { generateTimeline } from '../timeline/timeline.js';

const popupContainer = document.getElementById('popup-container');
const threadsContainer = document.getElementById('threads-container');
const messageContainer = document.getElementById('messages-container');

const onListItemClick = (thread) => {
  renderMessages(thread.messages);

  popupContainer.style.display = 'none';
  messageContainer.style.display = 'flex';

  markAs(thread.id, 'read');
};

const generateListItem = (thread) => {
  const latestMessage = thread.messages[thread.messages.length - 1];
  const { received, sender, subject, snippet } = latestMessage;

  const listItem = document.createElement('div');
  listItem.className = 'list-item';

  listItem.innerHTML = `
    <div class="data">
      <div>
        <div class="subject">${subject}</div>
        <div class="sender">${sender}</div>
      </div>
      <div class="received">${received}</div>
    </div>
    <div class="snippet">${snippet}</div>
  `;

  const deleteButton = generateButton({
    icon: deleteIcon,
    title: 'Move to trash',
    spinner: true,
    action: () => moveToTrash(thread.id).then(() => {
      listItem.style.opacity = 0;
      listItem.addEventListener('transitionend', (event) => {
        listItem.remove();
        event.currentTarget.removeEventListener('transitionend', event.handler);
      });
    })
  })

  const receivedDiv = listItem.querySelector('.received');
  receivedDiv.appendChild(deleteButton);

  listItem.addEventListener('click', () => onListItemClick(thread));

  return listItem;
};

const generateActionsRow = async () => {
  const buttons = [
    {
      icon: refreshIcon,
      action: () =>
        chrome.runtime.sendMessage({ action: 'fetchUnreadThreads' }, () => {
          generateThreadList();
          generateTimeline('today');
        }),
      title: 'Refresh'
    },
    {
      text: await getEmail(),
      icon: forwardToInboxIcon,
      action: () => chrome.runtime.sendMessage({ action: 'openGmail' }),
      title: 'Go to your inbox'
    }
  ];

  return actionButtonRow(buttons);
};

export const generateThreadList = async () => {
  popupContainer.style.display = 'flex';
  messageContainer.style.display = 'none';
  threadsContainer.innerHTML = '';

  const actionsRow = await generateActionsRow();
  threadsContainer.appendChild(actionsRow);

  const { unreadThreads } = await chrome.storage.session.get(['unreadThreads']);

  if (unreadThreads.length) {
    const listItems = unreadThreads.map(generateListItem);
    threadsContainer.append(...listItems);
  } else {
    const noMessages = document.createElement('div');

    noMessages.className = 'no-messages';
    noMessages.innerHTML = `
      <div class="no-messages">No unread messages</div>
    `;

    threadsContainer.appendChild(noMessages);
  }

  messageContainer.innerHTML = '';
  messageContainer.style.display = 'none';
  popupContainer.style.display = 'flex';
};
