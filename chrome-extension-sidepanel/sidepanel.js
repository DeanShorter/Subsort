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
    loadVideo: function() {
      var videoId = extractVideoId(urlInput.value);
      if (!videoId) {
        urlInput.style.borderColor = '#c44';
        setTimeout(function() { urlInput.style.borderColor = '#444'; }, 1500);
        return;
      }
      slot.currentVideoId = videoId;
      videoArea.innerHTML = '';
      var iframe = document.createElement('iframe');
      iframe.src = buildWatchUrl(videoId);
      iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';
      iframe.allow = 'autoplay; encrypted-media';
      iframe.referrerPolicy = 'no-referrer';
      videoArea.appendChild(iframe);
    },
    clearVideo: function() {
      videoArea.innerHTML = '<span class="placeholder">No video loaded</span>';
      urlInput.value = '';
      slot.currentVideoId = null;
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

// --- Listen for "split view" messages from content script ---

chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.action === 'loadVideo' && msg.url) {
    // Load into the first empty slot, or top if both are full
    if (!slots.top.currentVideoId) {
      slots.top.loadFromUrl(msg.url);
    } else if (!slots.bottom.currentVideoId) {
      slots.bottom.loadFromUrl(msg.url);
    } else {
      slots.top.loadFromUrl(msg.url);
    }
  }
});

// --- Drag handle for resizing ---

var handle = document.getElementById('drag-handle');
var slotTop = document.getElementById('slot-top');
var slotBottom = document.getElementById('slot-bottom');
var container = document.getElementById('container');
var dragging = false;

handle.addEventListener('mousedown', function(e) {
  e.preventDefault();
  dragging = true;
  handle.classList.add('dragging');
  document.body.style.cursor = 'row-resize';
  document.querySelectorAll('iframe').forEach(function(f) { f.style.pointerEvents = 'none'; });
});

document.addEventListener('mousemove', function(e) {
  if (!dragging) return;
  var containerRect = container.getBoundingClientRect();
  var handleHeight = handle.offsetHeight;
  var totalHeight = containerRect.height - handleHeight;
  var offsetY = e.clientY - containerRect.top;

  var minPx = 80;
  var topHeight = Math.max(minPx, Math.min(offsetY, totalHeight - minPx));
  var topPercent = (topHeight / totalHeight) * 100;

  slotTop.style.flex = '0 0 ' + topPercent + '%';
  slotBottom.style.flex = '0 0 ' + (100 - topPercent) + '%';
});

document.addEventListener('mouseup', function() {
  if (!dragging) return;
  dragging = false;
  handle.classList.remove('dragging');
  document.body.style.cursor = '';
  document.querySelectorAll('iframe').forEach(function(f) { f.style.pointerEvents = ''; });
});
