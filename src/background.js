import { getMessage, getUnread } from './api.js';

let TOKEN;

const badgeColor = '#ffa500'; // var(--orange)

const formatSender = (senderValue) => {
  let sender = senderValue;

  const matches = senderValue.match(/^(.*?) <(.*?)>$/);

  if (matches?.length === 3) {
    const senderName = matches[1];
    const senderEmail = matches[2];
    sender = `${senderName}&nbsp;&lt;${senderEmail}&gt;`;
  }

  return sender;
};

const formatBody = (data) => {
  const { parts, body } = data;

  const endcodedBody = parts
    ? parts.find((p) => p.mimeType === 'text/html')?.body.data
    : body?.data;

  let bodyHtml = '';

  if (endcodedBody) {
    try {
      let base64 = endcodedBody.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const rawData = atob(base64);
      const encoding = 'utf-8';
      const decoder = new TextDecoder(encoding);
      const uint8Array = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        uint8Array[i] = rawData.charCodeAt(i);
      }
      bodyHtml = decoder.decode(uint8Array);
    } catch (e) {
      console.log(`Parse failed for: ${endcodedBody}. Error: ${e}`);
    }
  }

  return bodyHtml;
};

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
  if (!chrome.runtime.lastError && token) {
    TOKEN = token;
    getMessages();
  } else {
    console.error('User is unauthenticated');
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    // When a token is requested, if it doesn't exist, fetch it and fetch message data
    case 'getAccessToken':
      if (TOKEN) {
        sendResponse({ token: TOKEN });
      } else {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          TOKEN = token;
          getMessages().then(() => sendResponse({ token: TOKEN }));
        });
      }
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
