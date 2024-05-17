import { generateCalendar } from './views/calendar.js';
import { generateList } from './views/threads.js';

// When the extension is clicked, fetch the auth token and generate the markup
chrome.runtime.sendMessage({ action: 'getAccessToken' }, (res) => {
  if (res.token && !chrome.runtime.lastError) {
    generateList();
    generateCalendar('today');
  } else {
    console.error('Error getting access token: ', chrome.runtime.lastError);
  }
});
