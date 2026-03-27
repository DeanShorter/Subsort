// Open the side panel when the extension icon is clicked.
chrome.action.onClicked.addListener((_tab) => {
  chrome.sidePanel.setOptions({ enabled: true });
  chrome.sidePanel.open({ windowId: _tab.windowId });
});

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // For YouTube links (works on any page)
  chrome.contextMenus.create({
    id: 'add-to-split-view',
    title: 'Add to Split View',
    contexts: ['link'],
    targetUrlPatterns: [
      '*://*.youtube.com/watch*',
      '*://*.youtube.com/shorts/*',
      '*://youtu.be/*'
    ]
  });

  // For Subsort feed video cards (right-click anywhere on the card)
  chrome.contextMenus.create({
    id: 'add-to-split-view-subsort',
    title: 'Add to Split View',
    contexts: ['all'],
    documentUrlPatterns: [
      'http://localhost/*',
      'https://localhost/*',
      'http://127.0.0.1/*'
    ]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add-to-split-view' && info.linkUrl) {
    chrome.sidePanel.open({ windowId: tab.windowId });
    chrome.runtime.sendMessage({
      action: 'loadVideo',
      url: info.linkUrl
    });
  }

  if (info.menuItemId === 'add-to-split-view-subsort') {
    // Ask the content script for the video ID under the cursor
    chrome.tabs.sendMessage(tab.id, { action: 'getVideoId' }, (response) => {
      if (response && response.videoId) {
        chrome.sidePanel.open({ windowId: tab.windowId });
        chrome.runtime.sendMessage({
          action: 'loadVideo',
          url: 'https://www.youtube.com/watch?v=' + response.videoId
        });
      }
    });
  }
});
