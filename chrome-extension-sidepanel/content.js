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
