// Script for the extension popup

// Get references to DOM elements
const hiddenChannelsContainer = document.getElementById('hidden-channels-container');

// Load and display hidden channels
function loadHiddenChannels() {
  browser.storage.local.get('hiddenChannels', (result) => {
    const hiddenChannels = result.hiddenChannels || [];
    
    if (hiddenChannels.length === 0) {
      // Show empty message
      hiddenChannelsContainer.innerHTML = '<div class="empty-message">No channels hidden yet. Click "Hide Channel" on any video to hide that channel.</div>';
      return;
    }
    
    // Clear container
    hiddenChannelsContainer.innerHTML = '';
    
    // Add each channel to the list
    hiddenChannels.forEach((channel, index) => {
      const channelItem = document.createElement('div');
      channelItem.className = 'channel-item';
      
      const channelName = document.createElement('div');
      channelName.className = 'channel-name';
      channelName.textContent = channel.name || 'Unknown Channel';
      
      const unhideButton = document.createElement('button');
      unhideButton.className = 'unhide-btn';
      unhideButton.textContent = 'Unhide';
      unhideButton.dataset.index = index;
      unhideButton.addEventListener('click', unhideChannel);
      
      channelItem.appendChild(channelName);
      channelItem.appendChild(unhideButton);
      hiddenChannelsContainer.appendChild(channelItem);
    });
  });
}

// Remove a channel from the hidden list
function unhideChannel(event) {
  const index = parseInt(event.target.dataset.index, 10);
  
  browser.storage.local.get('hiddenChannels', (result) => {
    const hiddenChannels = result.hiddenChannels || [];
    
    // Remove the channel at the specified index
    if (index >= 0 && index < hiddenChannels.length) {
      hiddenChannels.splice(index, 1);
      
      // Save the updated list
      browser.storage.local.set({ hiddenChannels }, () => {
        // Reload the displayed list
        loadHiddenChannels();
        
        // Notify content script to update the page
        notifyContentScript();
      });
    }
  });
}

// Notify content script to refresh hidden channels
function notifyContentScript() {
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url.includes('rumble.com')) {
      browser.tabs.sendMessage(tabs[0].id, { action: 'refreshHiddenChannels' })
        .catch(error => console.log('Error sending message:', error));
    }
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', loadHiddenChannels);
