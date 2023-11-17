export const markRead = async (id) => {
  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const apiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`;
  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const body = JSON.stringify({
    removeLabelIds: ['UNREAD']
  });

  return fetch(apiUrl, { method: 'POST', headers, body })
    .then((result) => {
      chrome.runtime.sendMessage({ action: 'fetchUnreadMessages' });
      console.log('Email marked as read:', result);
    })
    .catch((error) => {
      console.error('Error marking email as read:', error);
    });
};

export const markUnread = async (id) => {
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
    .then((result) => {
      chrome.runtime.sendMessage({ action: 'fetchUnreadMessages' });
      console.log('Email marked as unread:', result);
    })
    .catch((error) => {
      console.error('Error marking email as unread:', error);
    });
};

export const moveToTrash = async (id) => {
  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const trashUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`;
  const modifyUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`;

  const modifyBody = JSON.stringify({
    removeLabelIds: ['INBOX']
  });

  const trashRes = await fetch(trashUrl, { method: 'POST', headers });
  const modifyRes = await fetch(modifyUrl, {
    method: 'POST',
    headers,
    body: modifyBody
  });

  if (!trashRes.ok || !modifyRes.ok) {
    throw new Error('Failed to move message to trash or remove from inbox');
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'fetchUnreadMessages' },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
};
