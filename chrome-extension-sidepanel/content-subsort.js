// Track which video card the user right-clicked on
var lastRightClickedVideoId = null;

document.addEventListener('contextmenu', function(e) {
  var card = e.target.closest('[data-video-id]');
  lastRightClickedVideoId = card ? card.getAttribute('data-video-id') : null;
});

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action === 'getVideoId') {
    sendResponse({ videoId: lastRightClickedVideoId });
  }
});
