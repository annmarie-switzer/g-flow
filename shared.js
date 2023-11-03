const markUnread = async (id) => {
  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const apiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`;
  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const body = JSON.stringify({
    addLabelIds: ['UNREAD']
  });

  return fetch(apiUrl, { method: 'POST', headers, body })
    .then((response) => response.json())
    .then((result) => {
      console.log('Email marked as unread:', result);
    })
    .catch((error) => {
      console.error('Error marking email as unread:', error);
    });
};

const moveToTrash = async (id) => {
  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const apiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`;
  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  return fetch(apiUrl, { method: 'POST', headers })
    .then((response) => response.json())
    .then((result) => {
      console.log('Email moved to trash:', result);
    })
    .catch((error) => {
      console.error('Error moving email to trash:', error);
    });
};

// @param details
// {
//   content: string | icon
//   action: function
// }
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
