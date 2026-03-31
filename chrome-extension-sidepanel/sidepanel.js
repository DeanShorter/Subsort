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
  // Reset flex to 50/50 on toggle
  document.getElementById('slot-top').style.flex = '';
  document.getElementById('slot-bottom').style.flex = '';
  saveState();
}

layoutBtn.addEventListener('click', function() {
  setLayout(!isHorizontal);
});

// --- State persistence ---

function saveState() {
  chrome.storage.local.set({
    splitState: {
      top: slots.top ? slots.top.currentVideoId : null,
      bottom: slots.bottom ? slots.bottom.currentVideoId : null,
      horizontal: isHorizontal
    }
  });
}

// --- Slot logic ---

var slots = {};

function setupSlot(position) {
  var urlInput = document.getElementById('url-' + position);
  var loadBtn = document.getElementById('load-' + position);
  var clearBtn = document.getElementById('clear-' + position);
  var videoArea = document.getElementById('video-' + position);

  var slot = {
    currentVideoId: null,
    loadFromUrl: function(url) {
      urlInput.value = url;
      slot.loadVideo();
    },
    loadFromVideoId: function(videoId) {
      urlInput.value = buildWatchUrl(videoId);
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
    loadVideo: function() {
      var videoId = extractVideoId(urlInput.value);
      if (!videoId) {
        urlInput.style.borderColor = 'var(--green)';
        setTimeout(function() { urlInput.style.borderColor = ''; }, 1500);
        return;
      }
      slot.loadFromVideoId(videoId);
    },
    clearVideo: function() {
      videoArea.innerHTML = '<span class="placeholder">No video loaded</span>';
      urlInput.value = '';
      slot.currentVideoId = null;
      saveState();
    }
  };

  loadBtn.addEventListener('click', slot.loadVideo);
  urlInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') slot.loadVideo();
  });
  clearBtn.addEventListener('click', slot.clearVideo);

  slots[position] = slot;
}

setupSlot('top');
setupSlot('bottom');

// --- Restore state from storage ---

chrome.storage.local.get('splitState', function(result) {
  var state = result.splitState;

  // Restore layout
  if (state && state.horizontal) setLayout(true);

  // Restore saved videos
  if (state && state.top) slots.top.loadFromVideoId(state.top);
  if (state && state.bottom) slots.bottom.loadFromVideoId(state.bottom);

  // Then load any pending video into an available slot
  chrome.runtime.sendMessage({ action: 'getPending' }, function(response) {
    if (response && response.url) {
      loadVideoIntoSlot(response.url);
    }
  });
});

// --- Listen for "split view" messages from content script / service worker ---

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
