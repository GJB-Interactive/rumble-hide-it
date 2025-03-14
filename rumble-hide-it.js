// Main content script for Rumble Hide It extension

// Keep track of hidden channels
let hiddenChannels = [];

// Load hidden channels from storage
function loadHiddenChannels() {
  browser.storage.local.get('hiddenChannels', (result) => {
    hiddenChannels = result.hiddenChannels || [];
    applyHiddenChannels();
  });
}

// Save hidden channels to storage
function saveHiddenChannels() {
  browser.storage.local.set({ hiddenChannels });
}

// Hide all videos from channels in the hiddenChannels list
function applyHiddenChannels() {
  // Find all video thumbnails on the page
  const videoElements = document.querySelectorAll('.videostream');
  
  videoElements.forEach(videoElement => {
    // Find the channel element within this video thumbnail
    const channelElement = videoElement.querySelector('.channel__link');
    
    if (channelElement) {
      const channelName = channelElement.textContent.trim();
      const channelUrl = channelElement.getAttribute('href');
      
      // If this channel is in our hidden list, hide the video
      if (hiddenChannels.some(channel => 
          channel.name === channelName || channel.url === channelUrl)) {
        videoElement.style.display = 'none';
      }
    }
  });
}

// Add "Hide Channel" option to playlist menu
function addHideChannelOption() {
  // Find all playlist menu options lists
  const menuLists = document.querySelectorAll('ol.playlist-menu__options');
  
  menuLists.forEach(menuList => {
    // Check if we've already added our option to this menu
    if (menuList.querySelector('.hide-channel-option')) {
      return;
    }
    
    // Find the associated video and channel
    const videoItem = menuList.closest('.videostream');
    if (!videoItem) return;
    
    const channelElement = videoItem.querySelector('.channel__link');
    if (!channelElement) return;
    
    const channelName = channelElement.textContent.trim();
    const channelUrl = channelElement.getAttribute('href');
    
    // Create the "Hide Channel" option
    const hideOption = document.createElement('li');
    hideOption.className = 'hide-channel-option';
    hideOption.innerHTML = '<button class="playlist-menu__option">Hide Channel</button>';
    
    // Add click handler
    hideOption.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Add to hidden channels
      const channelInfo = {
        name: channelName,
        url: channelUrl
      };
      
      // Only add if not already in the list
      if (!hiddenChannels.some(channel => 
          channel.name === channelName || channel.url === channelUrl)) {
        hiddenChannels.push(channelInfo);
        saveHiddenChannels();
      }
      
      // Hide all videos from this channel on the current page
      applyHiddenChannels();
      
      // Close the dropdown menu
      const openMenu = document.querySelector('.playlist-menu.playlist-menu--visible');
      if (openMenu) {
        openMenu.classList.remove('playlist-menu--visible');
      }
    });
    
    // Add to menu
    menuList.appendChild(hideOption);
  });
}

// Observe DOM changes to handle dynamically loaded content
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Check if any added nodes contain video elements or menus
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList && 
                (node.classList.contains('videostream') || 
                 node.querySelector('.videostream') || 
                 node.querySelector('.playlist-menu__options'))) {
              shouldUpdate = true;
              break;
            }
          }
        }
      }
      
      if (shouldUpdate) break;
    }
    
    if (shouldUpdate) {
      // New videos or menus have been added, so update our elements
      addHideChannelOption();
      applyHiddenChannels();
    }
  });
  
  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize the extension
function init() {
  loadHiddenChannels();
  addHideChannelOption();
  setupMutationObserver();
  
  // Add click handler for dropdown menu buttons to ensure our option gets added
  document.addEventListener('click', (event) => {
    const target = event.target;
    
    // Check if a menu toggle button was clicked
    if (target.closest('.playlist-menu__button')) {
      // Small delay to ensure the menu is fully open
      setTimeout(addHideChannelOption, 50);
    }
  });
  
  // Listen for messages from the popup
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'refreshHiddenChannels') {
      loadHiddenChannels();
    }
    return Promise.resolve({received: true});
  });
}

// Run initialization when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
