import { getMessage, getUnread } from './api.js';
import { formatBody, formatSender } from './formatters.js';

let TOKEN;

const badgeColor = '#ffa500'; // var(--orange)

const getMessageDetails = async (messageId) => {
  const messageDetails = await getMessage(messageId, TOKEN);

  const senderValue = messageDetails.payload.headers.find((header) =>
    /from/i.test(header.name)
  ).value;

  const sender = formatSender(senderValue);

  const subject = messageDetails.payload.headers.find((header) =>
    /subject/i.test(header.name)
  ).value;

  const body = formatBody(messageDetails.payload);

  return {
    id: messageDetails.id,
    threadId: messageDetails.threadId,
    sender,
    subject,
    snippet: messageDetails.snippet,
    body,
    internalDate: messageDetails.internalDate
  };
};

export const getMessages = async () => {
  try {
    const data = await getUnread(TOKEN);
    const allUnread = data.messages ?? [];

    const requests = allUnread.map((message) => getMessageDetails(message.id));

    const messages = await Promise.all(requests);

    const sorted = messages.sort((a, b) => b.internalDate - a.internalDate);

    const uniqueThreadIds = new Set();

    const unreadMessages = sorted.reduce((acc, message) => {
      if (!uniqueThreadIds.has(message.threadId)) {
        uniqueThreadIds.add(message.threadId);

        acc.push({
          id: message.id,
          sender: message.sender,
          subject: message.subject,
          snippet: message.snippet,
          body: message.body,
          received: message.internalDate
        });
      }

      return acc;
    }, []);

    await chrome.storage.session.set({ unreadMessages });

    if (unreadMessages.length > 0) {
      const text =
        unreadMessages.length > 99 ? '99+' : String(unreadMessages.length);

      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }

    return unreadMessages;
  } catch (error) {
    console.error('Error getting messages: ', error);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }
};

// On startup, access the token, fetch messages, and set data in storage
chrome.identity.getAuthToken({ interactive: false }, (token) => {
  if (token && !chrome.runtime.lastError) {
    TOKEN = token;
    getMessages();
  } else {
    console.error('User is unauthenticated: ', chrome.runtime.lastError);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getAccessToken':
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (token === TOKEN) {
          sendResponse({ token });
        } else {
          TOKEN = token;
          getMessages().then(() => sendResponse({ token }));
        }
      });
      return true;
    case 'fetchUnreadMessages':
      getMessages().then(sendResponse);
      return true;
    default:
      break;
  }
});

const refreshIntervalInMinutes = 0.5;
const refreshIntervalInMilliseconds = refreshIntervalInMinutes * 60 * 1000;
setInterval(getMessages, refreshIntervalInMilliseconds);
