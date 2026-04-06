// Reads the Supabase auth token from localStorage on the subsort domain
// and relays it to the extension's service worker.

var AUTH_STORAGE_KEY = 'sb-eaubvwmofgydqtmwtkmp-auth-token';

function getAuthData() {
  try {
    var raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    // Supabase stores { access_token, refresh_token, user, ... }
    if (parsed && parsed.access_token) {
      return {
        accessToken: parsed.access_token,
        refreshToken: parsed.refresh_token,
        userId: parsed.user ? parsed.user.id : null,
        email: parsed.user ? parsed.user.email : null
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Send auth data to the service worker on page load
function sendAuth() {
  var auth = getAuthData();
  chrome.runtime.sendMessage({ action: 'authUpdate', auth: auth });
}

// Send on load
sendAuth();

// Also watch for storage changes (login/logout on the web app)
window.addEventListener('storage', function(e) {
  if (e.key === AUTH_STORAGE_KEY) {
    sendAuth();
  }
});

// Listen for auth requests from the service worker
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action === 'getAuth') {
    sendResponse({ auth: getAuthData() });
  }
});

// Periodically re-send in case token was refreshed in-page (Supabase refreshes silently)
setInterval(sendAuth, 60000);
