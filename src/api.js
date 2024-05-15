const soFetch = async (url, options) => {
  const { token } = await chrome.runtime.sendMessage({
    action: 'getAccessToken'
  });

  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  options = { ...options, headers };

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response.json();
    }
  } catch (e) {
    console.error(`API error for URL: ${url}. Error: ${e}`);
    throw e;
  }
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

export const getEmail = async () => {
  const { emailAddress } = await soFetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile'
  );

  return emailAddress;
};

/** @param action 'read' | 'unread' */
export const markAs = async (id, action) => {
  const apiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`;

  const actions = {
    read: 'removeLabelIds',
    unread: 'addLabelIds'
  };

  const body = JSON.stringify({
    [actions[action]]: ['UNREAD']
  });

  await soFetch(apiUrl, { method: 'POST', body });
  chrome.runtime.sendMessage({ action: 'fetchUnreadMessages' });
};

export const moveToTrash = async (id) => {
  const trashUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`;
  const modifyUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`;

  const body = JSON.stringify({
    removeLabelIds: ['INBOX']
  });

  const method = 'POST';

  await soFetch(trashUrl, { method });
  await soFetch(modifyUrl, { method, body });

  chrome.runtime.sendMessage({ action: 'fetchUnreadMessages' });
};

export const getEvents = async (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const startOfDay = new Date(year, month, day).toISOString();
  const endOfDay = new Date(year, month, day + 1).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime`;

  const { items } = await soFetch(url);
  return items;
};
