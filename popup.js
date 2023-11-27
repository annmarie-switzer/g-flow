import { getMessages } from './background.js';
import { generateList } from './list.js';

chrome.identity.getAuthToken({ interactive: true }, (token) => {
  if (!chrome.runtime.lastError && token) {
    getMessages(token).then(generateList);
  } else {
    console.error('Auth error: ', chrome.runtime.lastError);
  }
});
