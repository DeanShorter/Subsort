// --- Iframe mode: strip page to video player only ---
if (window !== window.top) {
  var style = document.createElement('style');
  style.textContent = `
    html, body {
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #000 !important;
    }

    /* Hide the header/nav */
    #masthead-container,
    #guide,
    tp-yt-app-drawer,
    ytd-mini-guide-renderer,
    ytd-masthead {
      display: none !important;
    }

    /* Hide everything below the player */
    #secondary,
    #related,
    #comments,
    #chat,
    #meta,
    #info,
    #below,
    #description,
    #panels,
    ytd-watch-next-secondary-results-renderer,
    ytd-comments,
    ytd-engagement-panel-section-list-renderer {
      display: none !important;
    }

    /* Remove top margin that YouTube adds for the header */
    ytd-app,
    #content,
    ytd-page-manager {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    /* Make the player fill the entire viewport */
    ytd-watch-flexy {
      --ytd-watch-flexy-width-ratio: 1 !important;
      --ytd-watch-flexy-height-ratio: 1 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    ytd-watch-flexy #full-bleed-container,
    ytd-watch-flexy #player-full-bleed-container,
    #player-container-outer,
    #player-container-inner,
    #player-container,
    ytd-player,
    #ytd-player,
    #movie_player {
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      min-height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .html5-video-container {
      width: 100% !important;
      height: 100% !important;
    }

    .html5-video-container video {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }

    /* Hide columns layout padding */
    #columns {
      padding: 0 !important;
      margin: 0 !important;
    }
    #primary, #primary-inner {
      padding: 0 !important;
      margin: 0 !important;
    }
  `;
  document.documentElement.appendChild(style);
}

// --- Main page mode: show "Split View" overlay button on watch pages ---
if (window === window.top) {
  function isWatchPage() {
    return location.pathname === '/watch' || location.pathname.startsWith('/shorts/');
  }

  function injectButton() {
    if (!isWatchPage()) {
      var existing = document.getElementById('yt-split-view-btn');
      if (existing) existing.remove();
      return;
    }
    if (document.getElementById('yt-split-view-btn')) return;

    var btn = document.createElement('button');
    btn.id = 'yt-split-view-btn';
    btn.textContent = 'Split View';
    btn.style.cssText = [
      'position: fixed',
      'top: 80px',
      'right: 16px',
      'z-index: 99999',
      'padding: 8px 16px',
      'background: rgba(0,0,0,0.75)',
      'color: #fff',
      'border: 1px solid rgba(255,255,255,0.2)',
      'border-radius: 6px',
      'font-family: system-ui, sans-serif',
      'font-size: 13px',
      'cursor: pointer',
      'backdrop-filter: blur(4px)',
      'transition: background 0.15s'
    ].join(';');

    btn.addEventListener('mouseenter', function() {
      btn.style.background = 'rgba(255,255,255,0.2)';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.background = 'rgba(0,0,0,0.75)';
    });

    btn.addEventListener('click', function() {
      chrome.runtime.sendMessage({
        action: 'loadVideo',
        url: location.href
      });
    });

    document.body.appendChild(btn);
  }

  // Inject on load and on YouTube SPA navigation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }

  // YouTube uses SPA navigation — listen for URL changes
  var lastUrl = location.href;
  new MutationObserver(function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      injectButton();
    }
  }).observe(document.body || document.documentElement, { childList: true, subtree: true });
}
