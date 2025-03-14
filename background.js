// Background script for Rumble Hide It extension

// Handle extension installation or update
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First-time installation
    browser.storage.local.set({ hiddenChannels: [] });
    
    // Open a welcome page
    browser.tabs.create({
      url: 'welcome.html'
    });
  } else if (details.reason === 'update') {
    // Extension update - ensure storage is properly initialized
    browser.storage.local.get('hiddenChannels', (result) => {
      if (!result.hasOwnProperty('hiddenChannels')) {
        browser.storage.local.set({ hiddenChannels: [] });
      }
    });
  }
});
