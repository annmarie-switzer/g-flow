export const getEmail = async () => {
  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    { headers }
  );

  const { emailAddress } = await res.json();
  return emailAddress;
};

export const getUnread = async (token) => {
  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const apiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';

  const queryParams = new URLSearchParams({ q: 'is:unread in:inbox' });
  const apiUrlWithQuery = `${apiUrl}?${queryParams.toString()}`;

  const response = await fetch(apiUrlWithQuery, { method: 'GET', headers });
  const data = await response.json();

  if (data.error) {
    console.error('Error fetching unread messages: ', data.error);
  }

  return data;
};

export const getMessage = async (id, token) => {
  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const apiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`;

  const reponse = await fetch(apiUrl, { method: 'GET', headers });
  return reponse.json();
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

  try {
    await fetch(apiUrl, { method: 'POST', headers, body });
    chrome.runtime.sendMessage({ action: 'fetchUnreadMessages' });
  } catch (e) {
    console.error('Error marking email as read: ', e);
  }
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

  try {
    await fetch(apiUrl, { method: 'POST', headers, body });
    chrome.runtime.sendMessage({ action: 'fetchUnreadMessages' });
  } catch (e) {
    console.error('Error marking email as unread: ', error);
  }
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

export const getEvents = async (date) => {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const endOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );

  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, { headers });

  const data = await response.json();
  if (data.items) {
    return data.items;
  } else {
    console.log('No events found.');
  }
};
