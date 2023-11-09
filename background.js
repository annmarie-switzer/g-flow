let TOKEN;

// TODO - If not logged in, only display the consent window when the app is interacted with
const getToken = async () =>
  new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });

const getUnread = async (token) => {
  const apiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  const queryParams = new URLSearchParams({ q: 'is:unread in:inbox' });
  const apiUrlWithQuery = `${apiUrl}?${queryParams.toString()}`;

  return fetch(apiUrlWithQuery, { method: 'GET', headers }).then((response) =>
    response.json()
  );
};

const getSenderInfo = (senderValue) => {
  let sender = senderValue;

  const matches = senderValue.match(/^(.*?) <(.*?)>$/);

  if (matches?.length === 3) {
    const senderName = matches[1];
    const senderEmail = matches[2];
    sender = `${senderName}&nbsp;&lt;${senderEmail}&gt;`;
  }

  return sender;
};

const getMessageDetails = async (messageId, token) => {
  const apiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
  const headers = new Headers({
    Authorization: `Bearer ${token}`
  });

  return fetch(apiUrl, { method: 'GET', headers })
    .then((response) => response.json())
    .then((messageDetails) => {
      const senderValue = messageDetails.payload.headers.find((header) =>
        /from/i.test(header.name)
      ).value;

      const sender = getSenderInfo(senderValue);

      const subject = messageDetails.payload.headers.find((header) =>
        /subject/i.test(header.name)
      ).value;

      const { parts, body } = messageDetails.payload;

      const endcodedBody = parts
        ? parts.find((p) => p.mimeType === 'text/html')?.body.data
        : body?.data;

      let bodyHtml;

      if (endcodedBody) {
        try {
          const base64 = endcodedBody.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          bodyHtml = atob(base64);
        } catch (e) {
          console.log(`Parse failed for: ${endcodedBody}. Error: ${e}`);
        }
      }

      return {
        id: messageDetails.id,
        threadId: messageDetails.threadId,
        sender,
        subject,
        snippet: messageDetails.snippet,
        body: bodyHtml,
        internalDate: messageDetails.internalDate
      };
    });
};

const setMessageData = async (token) => {
  try {
    const data = await getUnread(token);
    const allUnread = data.messages;

    if (!allUnread || allUnread.length === 0) {
      return;
    }

    const requests = allUnread.map((message) =>
      getMessageDetails(message.id, token)
    );

    Promise.all(requests).then((messages) => {
      const sorted = messages.sort((a, b) => b.internalDate - a.internalDate);

      const uniqueThreadIds = new Set();

      const unreadMessages = sorted.reduce((acc, message) => {
        const threadIds = acc.map((m) => m.threadId);
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

      chrome.storage.session.set({ unreadMessages });
      chrome.action.setBadgeText({ text: String(unreadMessages.length) });
    });
  } catch (error) {
    console.error('Error:', error);
  }
};

const main = async () => {
  TOKEN = await getToken();
  setMessageData(TOKEN);
};

main();

// Expose the token via messaging
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAccessToken') {
    sendResponse({ token: TOKEN });
  }
});

// Trigger fetching from UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchUnreadMessages') {
    setMessageData(TOKEN).then(sendResponse);
  }
});

// Run program on browser start
chrome.runtime.onStartup.addListener(() => {
  console.log('detecting onStartup event');
  main();
});

// Run program on sign in, clear Chrome storage on sign out
chrome.identity.onSignInChanged.addListener((account, signedIn) => {
  console.log('detecting signIn event');
  if (signedIn) {
    main();
  } else {
    chrome.storage.session.clear(() => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error clearing Chrome storage: ',
          chrome.runtime.lastError
        );
      }
    });
  }
});

// Re-run every 5 minutes
const refreshIntervalInMinutes = 5;
const refreshIntervalInMilliseconds = refreshIntervalInMinutes * 60 * 1000;
setInterval(main, refreshIntervalInMilliseconds);
