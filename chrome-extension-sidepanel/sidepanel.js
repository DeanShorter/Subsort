// --- Auth UI ---

var APP_ORIGIN = 'https://subsort-git-dev-deanshorters-projects.vercel.app';
var authBanner = document.getElementById('auth-banner');
var authNotLoggedIn = document.getElementById('auth-not-logged-in');
var authFree = document.getElementById('auth-free');
var authPro = document.getElementById('auth-pro');

function updateAuthUI(state) {
  authBanner.style.display = 'block';
  authNotLoggedIn.style.display = 'none';
  authFree.style.display = 'none';
  authPro.style.display = 'none';

  if (!state || !state.isAuthenticated) {
    authNotLoggedIn.style.display = 'flex';
  } else if (state.tier === 'free') {
    authFree.style.display = 'flex';
    document.getElementById('auth-email-free').textContent = state.email || '';
  } else {
    authPro.style.display = 'flex';
    document.getElementById('auth-email-pro').textContent = state.email || '';
  }
}

// Request auth state from service worker
chrome.runtime.sendMessage({ action: 'getAuthState' }, function(response) {
  if (chrome.runtime.lastError) return;
  if (response && response.state) updateAuthUI(response.state);
});

// Listen for auth state changes
chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.action === 'authStateChanged' && msg.state) {
    updateAuthUI(msg.state);
  }
});

// Login button
document.getElementById('auth-login-btn').addEventListener('click', function() {
  chrome.runtime.sendMessage({ action: 'openSubscrub' });
});

// Upgrade button
document.getElementById('auth-upgrade-btn').addEventListener('click', function() {
  chrome.runtime.sendMessage({ action: 'openSubscrub' });
});

// --- YouTube URL parsing ---

function extractVideoId(url) {
  if (!url) return null;
  url = url.trim();

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

function buildWatchUrl(videoId) {
  return 'https://www.youtube.com/watch?v=' + videoId;
}

// --- Layout toggle ---

var slotsWrap = document.getElementById('slots-wrap');
var layoutBtn = document.getElementById('toggle-layout');
var layoutIcon = document.getElementById('layout-icon');
var isHorizontal = false;

var verticalIcon = '<rect x="1" y="1" width="14" height="6" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="1" y="9" width="14" height="6" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>';
var horizontalIcon = '<rect x="1" y="1" width="6" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="9" y="1" width="6" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>';

function setLayout(horizontal) {
  isHorizontal = horizontal;
  if (horizontal) {
    slotsWrap.classList.add('horizontal');
    layoutIcon.innerHTML = horizontalIcon;
  } else {
    slotsWrap.classList.remove('horizontal');
    layoutIcon.innerHTML = verticalIcon;
  }
  document.getElementById('slot-top').style.flex = '';
  document.getElementById('slot-bottom').style.flex = '';
  saveState();
}

layoutBtn.addEventListener('click', function() {
  if (!isHorizontal) {
    saveState();
    chrome.storage.local.set({ splitState: {
      top: slots.top ? slots.top.currentVideoId : null,
      bottom: slots.bottom ? slots.bottom.currentVideoId : null,
      horizontal: true,
      dark: isDark
    }}, function() {
      chrome.runtime.sendMessage({ action: 'popout' });
    });
  } else {
    chrome.storage.local.set({ splitState: {
      top: slots.top ? slots.top.currentVideoId : null,
      bottom: slots.bottom ? slots.bottom.currentVideoId : null,
      horizontal: false,
      dark: isDark
    }}, function() {
      chrome.runtime.sendMessage({ action: 'dockin' });
    });
  }
});

// --- Dark mode ---

var isDark = false;
var themeBtn = document.getElementById('toggle-theme');
var themeIcon = document.getElementById('theme-icon');

var sunIcon = '<circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>';
var moonIcon = '<path d="M13 8.5a5.5 5.5 0 01-7.5-7.5 6.5 6.5 0 107.5 7.5z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>';

function setTheme(dark) {
  isDark = dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeIcon.innerHTML = dark ? sunIcon : moonIcon;
  saveState();
}

themeBtn.addEventListener('click', function() {
  setTheme(!isDark);
});

// --- State persistence ---

function saveState() {
  chrome.storage.local.set({
    splitState: {
      top: slots.top ? slots.top.currentVideoId : null,
      bottom: slots.bottom ? slots.bottom.currentVideoId : null,
      horizontal: isHorizontal,
      dark: isDark
    }
  });
}

// --- Slot logic ---

var slots = {};

function setupSlot(position) {
  var videoArea = document.getElementById('video-' + position);
  var clearBtn = document.querySelector('.clear-btn[data-slot="' + position + '"]');

  var slot = {
    currentVideoId: null,
    loadFromUrl: function(url) {
      var videoId = extractVideoId(url);
      if (videoId) slot.loadFromVideoId(videoId);
    },
    loadFromVideoId: function(videoId) {
      slot.currentVideoId = videoId;
      videoArea.innerHTML = '';
      var iframe = document.createElement('iframe');
      iframe.src = buildWatchUrl(videoId);
      iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';
      iframe.allow = 'autoplay; encrypted-media';
      iframe.referrerPolicy = 'no-referrer';
      videoArea.appendChild(iframe);
      saveState();
    },
    clearVideo: function() {
      videoArea.innerHTML = '<span class="placeholder">No video loaded</span>';
      slot.currentVideoId = null;
      saveState();
    }
  };
  clearBtn.addEventListener('click', slot.clearVideo);

  slots[position] = slot;
}

setupSlot('top');
setupSlot('bottom');

// --- Swap videos ---

document.getElementById('swap-btn').addEventListener('click', function() {
  var topId = slots.top.currentVideoId;
  var bottomId = slots.bottom.currentVideoId;

  if (!topId && !bottomId) return;

  // Clear both
  slots.top.clearVideo();
  slots.bottom.clearVideo();

  // Reload swapped
  if (bottomId) slots.top.loadFromVideoId(bottomId);
  if (topId) slots.bottom.loadFromVideoId(topId);
});

// --- Restore state from storage ---

chrome.storage.local.get('splitState', function(result) {
  var state = result.splitState;

  if (state && state.horizontal) setLayout(true);
  if (state && state.dark) setTheme(true);
  if (state && state.top) slots.top.loadFromVideoId(state.top);
  if (state && state.bottom) slots.bottom.loadFromVideoId(state.bottom);

  chrome.runtime.sendMessage({ action: 'getPending' }, function(response) {
    if (chrome.runtime.lastError) return;
    if (response && response.url) {
      loadVideoIntoSlot(response.url);
    }
  });
});

// --- Listen for messages ---

function loadVideoIntoSlot(url) {
  if (!slots.top.currentVideoId) {
    slots.top.loadFromUrl(url);
  } else if (!slots.bottom.currentVideoId) {
    slots.bottom.loadFromUrl(url);
  } else {
    slots.top.loadFromUrl(url);
  }
}

chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.action === 'loadVideo' && msg.url) {
    loadVideoIntoSlot(msg.url);
  }
});

// --- Drag handle for resizing ---

var handle = document.getElementById('drag-handle');
var slotTop = document.getElementById('slot-top');
var slotBottom = document.getElementById('slot-bottom');
var dragging = false;

handle.addEventListener('mousedown', function(e) {
  e.preventDefault();
  dragging = true;
  handle.classList.add('dragging');
  document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
  document.querySelectorAll('iframe').forEach(function(f) { f.style.pointerEvents = 'none'; });
});

document.addEventListener('mousemove', function(e) {
  if (!dragging) return;
  var wrapRect = slotsWrap.getBoundingClientRect();
  var minPx = 80;

  if (isHorizontal) {
    var handleWidth = handle.offsetWidth;
    var totalWidth = wrapRect.width - handleWidth;
    var offsetX = e.clientX - wrapRect.left;
    var leftWidth = Math.max(minPx, Math.min(offsetX, totalWidth - minPx));
    var leftPercent = (leftWidth / totalWidth) * 100;
    slotTop.style.flex = '0 0 ' + leftPercent + '%';
    slotBottom.style.flex = '0 0 ' + (100 - leftPercent) + '%';
  } else {
    var handleHeight = handle.offsetHeight;
    var totalHeight = wrapRect.height - handleHeight;
    var offsetY = e.clientY - wrapRect.top;
    var topHeight = Math.max(minPx, Math.min(offsetY, totalHeight - minPx));
    var topPercent = (topHeight / totalHeight) * 100;
    slotTop.style.flex = '0 0 ' + topPercent + '%';
    slotBottom.style.flex = '0 0 ' + (100 - topPercent) + '%';
  }
});

document.addEventListener('mouseup', function() {
  if (!dragging) return;
  dragging = false;
  handle.classList.remove('dragging');
  document.body.style.cursor = '';
  document.querySelectorAll('iframe').forEach(function(f) { f.style.pointerEvents = ''; });
});
