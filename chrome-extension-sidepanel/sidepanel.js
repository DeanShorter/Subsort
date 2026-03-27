// --- YouTube URL parsing ---

function extractVideoId(url) {
  if (!url) return null;
  url = url.trim();

  let match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  match = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  return null;
}

// --- Slot logic ---

function setupSlot(position) {
  const urlInput = document.getElementById(`url-${position}`);
  const loadBtn = document.getElementById(`load-${position}`);
  const muteBtn = document.getElementById(`mute-${position}`);
  const clearBtn = document.getElementById(`clear-${position}`);
  const playerFrame = document.getElementById(`player-${position}`);

  let isMuted = false;
  let currentVideoId = null;

  function sendToPlayer(msg) {
    playerFrame.contentWindow.postMessage(msg, '*');
  }

  function loadVideo() {
    const videoId = extractVideoId(urlInput.value);
    if (!videoId) {
      urlInput.style.borderColor = '#c44';
      setTimeout(() => { urlInput.style.borderColor = '#444'; }, 1500);
      return;
    }

    currentVideoId = videoId;
    isMuted = false;
    muteBtn.textContent = 'Mute';
    muteBtn.disabled = false;
    sendToPlayer({ action: 'load', videoId, muted: false });
  }

  function toggleMute() {
    if (!currentVideoId) return;
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
    sendToPlayer({ action: 'load', videoId: currentVideoId, muted: isMuted });
  }

  function clearVideo() {
    urlInput.value = '';
    currentVideoId = null;
    isMuted = false;
    muteBtn.textContent = 'Mute';
    muteBtn.disabled = true;
    sendToPlayer({ action: 'clear' });
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
  document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
});

document.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const containerRect = container.getBoundingClientRect();
  const handleHeight = handle.offsetHeight;
  const totalHeight = containerRect.height - handleHeight;
  const offsetY = e.clientY - containerRect.top;

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
