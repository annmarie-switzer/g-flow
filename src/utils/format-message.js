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

const formatReceived = (received) => {
  const date = new Date(parseInt(received));
  const today = new Date();
  const userLocale = navigator.language || 'en-US';

  if (date.toLocaleDateString() === today.toLocaleDateString()) {
    return new Intl.DateTimeFormat(userLocale, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  } else {
    return new Intl.DateTimeFormat(userLocale, {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
};

export const formatMessage = (message) => {
  const senderValue = message.payload.headers.find((header) =>
    /from/i.test(header.name)
  ).value;

  const sender = formatSender(senderValue);

  const subject = message.payload.headers.find((header) =>
    /subject/i.test(header.name)
  ).value;

  const body = formatBody(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    sender,
    subject,
    snippet: message.snippet,
    body,
    received: formatReceived(message.internalDate)
  };
};

