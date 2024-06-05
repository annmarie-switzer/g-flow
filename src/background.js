import { formatMessage } from './utils/format-message.js';

let TOKEN;
const badgeColor = '#ffa500'; // var(--orange)

const getThreads = async () => {
  const headers = new Headers({
    Authorization: `Bearer ${TOKEN}`
  });

  const apiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/threads';

  const queryParams = new URLSearchParams({ q: 'is:unread in:inbox' });
  const apiUrlWithQuery = `${apiUrl}?${queryParams.toString()}`;

  let response = await fetch(apiUrlWithQuery, { method: 'GET', headers });

  if (response.status === 401) {
    TOKEN = await chrome.identity.getAuthToken({ interactive: false });
    headers.set('Authorization', `Bearer ${TOKEN}`);
    response = await fetch(apiUrlWithQuery, { method: 'GET', headers });
  }

  const data = await response.json();

  if (data.threads) {
    const threadReqs = data.threads.map(async (thread) => {
      const response = await fetch(`${apiUrl}/${thread.id}`, {
        method: 'GET',
        headers
      });
      return response.json();
    });

    const threads = await Promise.all(threadReqs);

    return threads;
  } else {
    return [];
  }
};

export const getUnreadThreads = async () => {
  try {
    const threads = await getThreads();

    const unreadThreads = threads.map((thread) => {
      const formattedMessages = thread.messages.map(formatMessage);
      return { ...thread, messages: formattedMessages };
    });

    await chrome.storage.session.set({ unreadThreads });

    if (unreadThreads.length > 0) {
      const text =
        unreadThreads.length > 99 ? '99+' : String(unreadThreads.length);

      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }

    return unreadThreads;
  } catch (error) {
    console.error('Error getting threads: ', error);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getAccessToken':
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (token === TOKEN) {
          sendResponse({ token });
        } else {
          TOKEN = token;
          getUnreadThreads().then(() => sendResponse({ token }));
        }
      });
      return true;
    case 'fetchUnreadThreads':
      getUnreadThreads().then(sendResponse);
      return true;
    case 'openGmail':
      chrome.tabs.query({ url: '*://mail.google.com/*' }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { active: true });
        } else {
          chrome.tabs.create({ url: 'https://mail.google.com/' });
        }
      });
      return true;
    default:
      break;
  }
});

// Fetch token and data on startup
chrome.identity.getAuthToken({ interactive: false }, (token) => {
  if (token && !chrome.runtime.lastError) {
    TOKEN = token;
    getUnreadThreads();
  } else {
    console.error('User is unauthenticated: ', chrome.runtime.lastError);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }
});

// Refetch every 30 seconds
setInterval(getUnreadThreads, 30_000);
