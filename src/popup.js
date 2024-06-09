import { generateThreadList } from './threads/threads.js';
import { generateTimeline } from './timeline/timeline.js';

chrome.runtime.sendMessage({ action: 'fetchUnreadThreads' }, () => {
  generateThreadList();
  generateTimeline('today');
});
