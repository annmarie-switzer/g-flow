import { formatMessage } from './utils/format-message.js';

const badgeColor = '#ffa500'; // var(--orange)

const getToken = async (interactive = false) => {
  const { token } = await chrome.identity.getAuthToken({ interactive });
  return token;
};

const getThreads = async (TOKEN) => {
  try {
    const headers = new Headers({
      Authorization: `Bearer ${TOKEN}`
    });

    const apiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/threads';
    const queryParams = new URLSearchParams({ q: 'is:unread in:inbox' });
    const apiUrlWithQuery = `${apiUrl}?${queryParams.toString()}`;

    const response = await fetch(apiUrlWithQuery, { method: 'GET', headers });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

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
  } catch (error) {
    console.error('Error getting threads: ', error);
  }
};

const getUnreadThreads = async (token) => {
  try {
    const TOKEN = token ?? (await getToken());
    const threads = await getThreads(TOKEN);

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
    console.error('Error getting unread threads: ', error);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }
};

const startup = () => {
  getToken().then((token) => {
    if (token) {
      getUnreadThreads(token);
    } else {
      console.error(
        "Background service couldn't get access token: ",
        chrome.runtime.lastError
      );
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    }
  });
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getAccessToken':
      getToken(true).then((token) => sendResponse(token));
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

startup();
setInterval(startup, 30_000);
