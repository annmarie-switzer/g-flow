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

export const getEmail = async () => {
  const { emailAddress } = await soFetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile'
  );

  return emailAddress;
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

/** @param action 'read' | 'unread' */
export const markAs = async (id, action) => {
  const apiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}/modify`;

  const actions = {
    read: 'removeLabelIds',
    unread: 'addLabelIds'
  };

  const body = JSON.stringify({
    [actions[action]]: ['UNREAD']
  });

  await soFetch(apiUrl, { method: 'POST', body });
  await chrome.runtime.sendMessage({ action: 'fetchUnreadThreads' });
};

export const moveToTrash = async (id) => {
  const trashUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}/trash`;
  const modifyUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}/modify`;

  const body = JSON.stringify({
    removeLabelIds: ['INBOX']
  });

  const method = 'POST';

  await soFetch(trashUrl, { method });
  await soFetch(modifyUrl, { method, body });

  await chrome.runtime.sendMessage({ action: 'fetchUnreadThreads' });
};
