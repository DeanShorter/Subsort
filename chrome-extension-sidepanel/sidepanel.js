// --- YouTube URL parsing ---

function extractVideoId(url) {
  if (!url) return null;
  url = url.trim();

  // youtu.be/VIDEO_ID
  let match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtube.com/watch?v=VIDEO_ID
  match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtube.com/embed/VIDEO_ID
  match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtube.com/shorts/VIDEO_ID
  match = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  return null;
}

function buildEmbedUrl(videoId) {
  const origin = chrome.runtime.getURL('').slice(0, -1); // remove trailing slash
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
}

// --- Slot logic ---

function setupSlot(position) {
  const urlInput = document.getElementById(`url-${position}`);
  const loadBtn = document.getElementById(`load-${position}`);
  const muteBtn = document.getElementById(`mute-${position}`);
  const clearBtn = document.getElementById(`clear-${position}`);
  const videoArea = document.getElementById(`video-${position}`);

  let isMuted = false;
  let iframe = null;

  function loadVideo() {
    const videoId = extractVideoId(urlInput.value);
    if (!videoId) {
      urlInput.style.borderColor = '#c44';
      setTimeout(() => { urlInput.style.borderColor = '#444'; }, 1500);
      return;
    }

    // Remove existing content
    videoArea.innerHTML = '';

    iframe = document.createElement('iframe');
    iframe.src = buildEmbedUrl(videoId);
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    videoArea.appendChild(iframe);

    isMuted = false;
    muteBtn.textContent = 'Mute';
    muteBtn.disabled = false;
  }

  function toggleMute() {
    if (!iframe) return;
    isMuted = !isMuted;
    // Post message to YouTube iframe API
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: isMuted ? 'mute' : 'unMute'
    }), '*');
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
  }

  function clearVideo() {
    videoArea.innerHTML = '<span class="placeholder">No video loaded</span>';
    urlInput.value = '';
    iframe = null;
    isMuted = false;
    muteBtn.textContent = 'Mute';
    muteBtn.disabled = true;
  }

  loadBtn.addEventListener('click', loadVideo);
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadVideo();
  });
  muteBtn.addEventListener('click', toggleMute);
  clearBtn.addEventListener('click', clearVideo);
}

setupSlot('top');
setupSlot('bottom');

// --- Drag handle for resizing ---

const handle = document.getElementById('drag-handle');
const slotTop = document.getElementById('slot-top');
const slotBottom = document.getElementById('slot-bottom');
const container = document.getElementById('container');

let dragging = false;

handle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  dragging = true;
  handle.classList.add('dragging');
  document.body.style.cursor = 'row-resize';
  // Prevent iframes from stealing pointer events while dragging
  document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
});

document.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const containerRect = container.getBoundingClientRect();
  const handleHeight = handle.offsetHeight;
  const totalHeight = containerRect.height - handleHeight;
  const offsetY = e.clientY - containerRect.top;

  // Clamp so neither slot gets smaller than 80px
  const minPx = 80;
  const topHeight = Math.max(minPx, Math.min(offsetY, totalHeight - minPx));
  const topPercent = (topHeight / totalHeight) * 100;

  slotTop.style.flex = `0 0 ${topPercent}%`;
  slotBottom.style.flex = `0 0 ${100 - topPercent}%`;
});

document.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  handle.classList.remove('dragging');
  document.body.style.cursor = '';
  document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '');
});
