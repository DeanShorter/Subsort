// === CONFIG ===
var SUPABASE_URL = 'https://eaubvwmofgydqtmwtkmp.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdWJ2d21vZmd5ZHF0bXd0a21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTYwMjMsImV4cCI6MjA4OTg3MjAyM30.iDrnPFcaTTD_lXlpH_jI5XxOR_Ox_HsNj6O9H4zcHJA';
var APP_ORIGIN = 'https://subsort-git-dev-deanshorters-projects.vercel.app';

// === AUTH STATE ===
var cachedAuth = null; // { accessToken, refreshToken, userId, email, tier }

function getAuth() {
  return cachedAuth;
}

async function fetchTier(accessToken, userId) {
  try {
    var res = await fetch(
      SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId + '&select=tier',
      {
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'apikey': SUPABASE_ANON_KEY
        }
      }
    );
    var data = await res.json();
    if (data && data.length > 0 && data[0].tier) {
      return data[0].tier;
    }
    return 'free';
  } catch (e) {
    return 'free';
  }
}

async function processAuthUpdate(auth) {
  if (!auth || !auth.accessToken) {
    cachedAuth = null;
    broadcastAuthState();
    return;
  }

  var tier = await fetchTier(auth.accessToken, auth.userId);

  cachedAuth = {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    userId: auth.userId,
    email: auth.email,
    tier: tier
  };

  broadcastAuthState();
}

function broadcastAuthState() {
  var state = cachedAuth
    ? { isAuthenticated: true, email: cachedAuth.email, tier: cachedAuth.tier }
    : { isAuthenticated: false, email: null, tier: null };

  chrome.runtime.sendMessage({ action: 'authStateChanged', state: state }, function() {
    if (chrome.runtime.lastError) { /* side panel might not be open */ }
  });
}

// === SIDE PANEL ===

chrome.action.onClicked.addListener((_tab) => {
  chrome.sidePanel.setOptions({ enabled: true });
  chrome.sidePanel.open({ windowId: _tab.windowId });
});

// === CONTEXT MENUS ===

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll();

  // Split View — YouTube links
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

  // Split View — YouTube watch pages
  chrome.contextMenus.create({
    id: 'add-to-split-view-page',
    title: 'Add to Subscrub Split View',
    contexts: ['page', 'video', 'frame', 'image'],
    documentUrlPatterns: [
      '*://*.youtube.com/watch*',
      '*://*.youtube.com/shorts/*'
    ]
  });

  // Split View — Subsort feed
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

  // Stash — YouTube links
  chrome.contextMenus.create({
    id: 'add-to-stash',
    title: 'Add to Subscrub Stash',
    contexts: ['link'],
    targetUrlPatterns: [
      '*://*.youtube.com/watch*',
      '*://*.youtube.com/shorts/*',
      '*://youtu.be/*'
    ]
  });

  // Stash — YouTube watch pages
  chrome.contextMenus.create({
    id: 'add-to-stash-page',
    title: 'Add to Subscrub Stash',
    contexts: ['page', 'video', 'frame', 'image'],
    documentUrlPatterns: [
      '*://*.youtube.com/watch*',
      '*://*.youtube.com/shorts/*'
    ]
  });

  // Stash — Subsort feed
  chrome.contextMenus.create({
    id: 'add-to-stash-subsort',
    title: 'Add to Subscrub Stash',
    contexts: ['all'],
    documentUrlPatterns: [
      'http://localhost:3000/*',
      'http://localhost:3001/*',
      'http://127.0.0.1:3000/*',
      'https://*.vercel.app/*'
    ]
  });
});

// === POPUP WINDOW ===

var popupWindowId = null;

// === PENDING VIDEO ===

var pendingVideoUrl = null;

// === STASH API ===

function extractVideoId(url) {
  if (!url) return null;
  var match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  match = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  return null;
}

async function addToStash(videoUrl, tab) {
  var auth = getAuth();

  if (!auth) {
    showNotification('Log in at Subscrub to use Stash.', tab);
    return;
  }

  if (auth.tier === 'free') {
    showNotification('Stash is a Pro feature. Upgrade at Subscrub.', tab);
    return;
  }

  var videoId = extractVideoId(videoUrl);
  if (!videoId) {
    showNotification('Could not identify a YouTube video.', tab);
    return;
  }

  try {
    var res = await fetch(APP_ORIGIN + '/api/stash/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + auth.accessToken
      },
      body: JSON.stringify({ youtube_video_id: videoId })
    });

    if (res.ok) {
      showNotification('Added to Stash.', tab);
    } else {
      var err = await res.json().catch(function() { return {}; });
      showNotification(err.error || 'Failed to add to Stash.', tab);
    }
  } catch (e) {
    showNotification('Failed to add to Stash. Check your connection.', tab);
  }
}

function showNotification(message, tab) {
  // Try badge text on the action icon briefly, or use content script injection
  if (tab && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function(msg) {
        // Show a brief toast notification
        var toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;padding:12px 20px;background:#1a1a1a;color:#fff;border-radius:12px;font-family:system-ui;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.3s;';
        document.body.appendChild(toast);
        setTimeout(function() { toast.style.opacity = '0'; }, 2500);
        setTimeout(function() { toast.remove(); }, 3000);
      },
      args: [message]
    }).catch(function() { /* can't inject — ignore */ });
  }
}

// === MESSAGE HANDLING ===

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Auth updates from content-auth.js
  if (msg.action === 'authUpdate') {
    processAuthUpdate(msg.auth);
  }

  // Auth requests from content-auth.js or side panel
  if (msg.action === 'getAuth') {
    // Forward to a tab running content-auth.js on the subsort domain
    // This is handled by content-auth.js directly via its own listener
  }

  // Side panel requests auth state
  if (msg.action === 'getAuthState') {
    var state = cachedAuth
      ? { isAuthenticated: true, email: cachedAuth.email, tier: cachedAuth.tier }
      : { isAuthenticated: false, email: null, tier: null };
    sendResponse({ state: state });
  }

  // Pending video
  if (msg.action === 'getPending') {
    sendResponse({ url: pendingVideoUrl });
    pendingVideoUrl = null;
  }

  // Popout to horizontal window
  if (msg.action === 'popout') {
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
        chrome.sidePanel.setOptions({ enabled: true });
      });
    });
  }

  // Dock back to side panel
  if (msg.action === 'dockin') {
    if (popupWindowId) {
      chrome.windows.remove(popupWindowId, () => { popupWindowId = null; });
    } else if (sender.tab) {
      chrome.windows.remove(sender.tab.windowId, () => { popupWindowId = null; });
    }
    chrome.windows.getLastFocused({ windowTypes: ['normal'] }, (win) => {
      if (win) chrome.sidePanel.open({ windowId: win.id });
    });
  }

  // Open subscrub.me for login
  if (msg.action === 'openSubscrub') {
    chrome.tabs.create({ url: APP_ORIGIN });
  }

  return true; // keep channel open for async sendResponse
});

// === SEND TO SIDE PANEL ===

function sendToSidePanel(url, windowId) {
  pendingVideoUrl = url;
  chrome.sidePanel.open({ windowId: windowId }).then(() => {
    chrome.runtime.sendMessage({ action: 'loadVideo', url: url }, () => {
      if (chrome.runtime.lastError) { /* panel will pick up pending */ }
    });
  });
}

// === CONTEXT MENU HANDLER ===

chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Split View
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

  // Stash
  if (info.menuItemId === 'add-to-stash' && info.linkUrl) {
    addToStash(info.linkUrl, tab);
  }
  if (info.menuItemId === 'add-to-stash-page') {
    addToStash(tab.url, tab);
  }
  if (info.menuItemId === 'add-to-stash-subsort') {
    chrome.tabs.sendMessage(tab.id, { action: 'getVideoId' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.videoId) return;
      addToStash('https://www.youtube.com/watch?v=' + response.videoId, tab);
    });
  }
});
