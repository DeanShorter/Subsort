// Only strip the page down to the video player when inside an iframe (our side panel)
if (window !== window.top) {
  var style = document.createElement('style');
  style.textContent = `
    html, body {
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #000 !important;
    }

    /* Hide everything by default */
    body > * {
      display: none !important;
    }

    /* Show the chain of elements leading to the player */
    ytd-app,
    ytd-app > #content,
    ytd-app > #content > ytd-page-manager,
    ytd-page-manager > ytd-watch-flexy,
    ytd-watch-flexy > #full-bleed-container,
    ytd-watch-flexy > #columns,
    ytd-watch-flexy > #columns > #primary,
    ytd-watch-flexy > #columns > #primary > #primary-inner,
    #player-container-outer,
    #player-container-inner,
    #player-container,
    ytd-player,
    #ytd-player,
    #player,
    #movie_player {
      display: block !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      z-index: 9999 !important;
    }

    .html5-video-container,
    .html5-video-container video {
      width: 100vw !important;
      height: 100vh !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      object-fit: contain !important;
    }

    /* Hide everything that isn't the player */
    #secondary,
    #related,
    #comments,
    #chat,
    #meta,
    #info,
    #below,
    #masthead-container,
    #guide,
    #panels,
    tp-yt-app-drawer,
    ytd-masthead,
    ytd-mini-guide-renderer,
    #description,
    ytd-watch-next-secondary-results-renderer,
    ytd-comments,
    ytd-engagement-panel-section-list-renderer {
      display: none !important;
    }

    /* Keep player controls visible and clickable */
    .ytp-chrome-bottom,
    .ytp-chrome-top {
      z-index: 10000 !important;
    }
  `;
  document.documentElement.appendChild(style);
}
