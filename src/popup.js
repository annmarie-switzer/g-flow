import { generateThreadList } from './threads/threads.js';
import { generateTimeline } from './timeline/timeline.js';

chrome.runtime.sendMessage({ action: 'getAccessToken' }, (token) => {
  if (token) {
    generateThreadList();
    generateTimeline('today');
  } else {
    console.error(
      "Popup couldn't get access token: ",
      chrome.runtime.lastError
    );
  }
});
