import { generateCalendar } from './calendar/calendar.js';
import { generateList } from './threads/threads.js';

chrome.runtime.sendMessage({ action: 'getAccessToken' }, (token) => {
  if (token) {
    generateList();
    generateCalendar('today');
  } else {
    console.error(
      "Popup couldn't get access token: ",
      chrome.runtime.lastError
    );
  }
});
