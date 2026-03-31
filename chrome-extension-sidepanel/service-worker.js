// Open the side panel when the extension icon is clicked.
chrome.action.onClicked.addListener((_tab) => {
  chrome.sidePanel.setOptions({ enabled: true });
  chrome.sidePanel.open({ windowId: _tab.windowId });
});

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: 'add-to-split-view',
    title: 'Add to Subscrub Split View',
    contexts: ['link'],
    targetUrlPatterns: [
      '*://*.youtube.com/watch*',
      '*://*.youtube.com/shorts/*',
      '*://youtu.be/*'
    ]
  });

  // Right-click anywhere on a YouTube watch/shorts page
  chrome.contextMenus.create({
    id: 'add-to-split-view-page',
    title: 'Add to Subscrub Split View',
    contexts: ['page', 'video', 'frame', 'image'],
    documentUrlPatterns: [
      '*://*.youtube.com/watch*',
      '*://*.youtube.com/shorts/*'
    ]
  });

  chrome.contextMenus.create({
    id: 'add-to-split-view-subsort',
    title: 'Add to Subscrub Split View',
    contexts: ['all'],
    documentUrlPatterns: [
      'http://localhost:3000/*',
      'http://localhost:3001/*',
      'http://127.0.0.1:3000/*',
      'https://*.vercel.app/*'
    ]
  });
});

// Track popup window ID so we can close it when docking back
var popupWindowId = null;

// Store pending video URL so the side panel can pick it up
var pendingVideoUrl = null;

// Side panel requests any pending video when it loads or reconnects
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getPending') {
    sendResponse({ url: pendingVideoUrl });
    pendingVideoUrl = null;
  }

  if (msg.action === 'popout') {
    // Disable the side panel so it closes, then open popup
    chrome.sidePanel.setOptions({ enabled: false });
    chrome.windows.getCurrent((win) => {
      var popWidth = win.width;
      var popHeight = Math.round(win.height * 0.4);
      var popLeft = win.left;
      var popTop = win.top + win.height - popHeight;
      chrome.windows.create({
        url: chrome.runtime.getURL('sidepanel.html'),
        type: 'popup',
        width: popWidth,
        height: popHeight,
        left: popLeft,
        top: popTop
      }, (w) => {
        popupWindowId = w.id;
        // Re-enable for next time
        chrome.sidePanel.setOptions({ enabled: true });
      });
    });
  }

  if (msg.action === 'dockin') {
    // Close the popup window and open the side panel
    if (popupWindowId) {
      chrome.windows.remove(popupWindowId, () => {
        popupWindowId = null;
      });
    } else if (sender.tab) {
      // If sent from a popup tab, close that window
      chrome.windows.remove(sender.tab.windowId, () => {
        popupWindowId = null;
      });
    }
    // Open side panel in the last focused normal window
    chrome.windows.getLastFocused({ windowTypes: ['normal'] }, (win) => {
      if (win) chrome.sidePanel.open({ windowId: win.id });
    });
  }
});

function sendToSidePanel(url, windowId) {
  // Always store as pending in case the panel isn't open yet
  pendingVideoUrl = url;
  // Open the panel (no-op if already open), then try direct send
  chrome.sidePanel.open({ windowId: windowId }).then(() => {
    chrome.runtime.sendMessage({ action: 'loadVideo', url: url }, () => {
      if (chrome.runtime.lastError) {
        // Panel just opened — it will pick up pendingVideoUrl on load
      }
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add-to-split-view' && info.linkUrl) {
    sendToSidePanel(info.linkUrl, tab.windowId);
  }

  if (info.menuItemId === 'add-to-split-view-page') {
    sendToSidePanel(tab.url, tab.windowId);
  }

  if (info.menuItemId === 'add-to-split-view-subsort') {
    chrome.tabs.sendMessage(tab.id, { action: 'getVideoId' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.videoId) return;
      sendToSidePanel('https://www.youtube.com/watch?v=' + response.videoId, tab.windowId);
    });
  }
});
