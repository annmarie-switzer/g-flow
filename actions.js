import { generateList } from './popup.js';

export const resetView = () => {
  const listContainer = document.getElementById('list-container');
  const messageContainer = document.getElementById('message-container');
  messageContainer.innerHTML = '';
  messageContainer.style.display = 'none';
  listContainer.style.display = 'flex';
};

export const goBack = () => {
  generateList();
  resetView();
};

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

export const moveToTrash = async (id, reset = false) => {
  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const apiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`;
  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  await fetch(apiUrl, { method: 'POST', headers });
  await chrome.runtime.sendMessage({ action: 'fetchUnreadMessages' });
  generateList();

  if (reset) {
    resetView();
  }
};
