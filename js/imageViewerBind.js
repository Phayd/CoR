// js/imageViewerBind.js
(() => {
  const App = window.App;

  // expects App.imageViewerOpen({ src, title?, callIn? }) to exist
  App.bindImageViewerOnce = function bindImageViewerOnce(el, getPayload){
    if(!el || el.dataset.viewerBound === '1') return;
    el.dataset.viewerBound = '1';

    el.addEventListener('click', (e) => {
      // If the tap-hint badge was tapped, let call-in preview handle it
      if(e.target && e.target.classList && e.target.classList.contains('tap-hint')){
        return;
      }

      const payload = (typeof getPayload === 'function') ? getPayload() : null;
      if(!payload || !payload.src) return;

      App.imageViewerOpen(payload);
    });
  };
})();
