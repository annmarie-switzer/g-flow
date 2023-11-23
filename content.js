const detectColorScheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

chrome.runtime.sendMessage({
  action: 'colorSchemeChanged',
  colorScheme: detectColorScheme()
});
