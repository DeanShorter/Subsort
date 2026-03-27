// Open the side panel when the extension icon is clicked.
chrome.action.onClicked.addListener((_tab) => {
  chrome.sidePanel.setOptions({ enabled: true });
  chrome.sidePanel.open({ windowId: _tab.windowId });
});

// Create context menu item for links
chrome.runtime.onInstalled.addListener(() => {
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
});

// Handle context menu click — forward to side panel
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add-to-split-view' && info.linkUrl) {
    // Open the side panel first (in case it's not open)
    chrome.sidePanel.open({ windowId: tab.windowId });
    // Forward the URL to the side panel
    chrome.runtime.sendMessage({
      action: 'loadVideo',
      url: info.linkUrl
    });
  }
});
