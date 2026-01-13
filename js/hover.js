// js/hover.js
(() => {
  const App = window.App;
  const d = App.dom;

  // ---------- Hover popup ----------
  App.getUnitPopupInfo = function(unitKey){
    if(!unitKey || !App.unitCatalog || !App.unitCatalog.units) return null;
    const u = App.unitCatalog.units[unitKey];
    if(!u || !u.card) return null;
    return {
      title: u.name || unitKey,
      src: `Units/${u.card}`
    };
  };

  App.showHoverPopupForUnit = function(unitKey, clientX, clientY){
    const info = App.getUnitPopupInfo(unitKey);
    if(!info) return;

    d.hoverPopupTitle.textContent = info.title;
    d.hoverPopupImg.src = info.src;
    App.applyAspectClass(d.hoverPopupImg);

    d.hoverPopup.style.display = 'block';
    App.positionHoverPopup(clientX, clientY);
  };

  App.positionHoverPopup = function(clientX, clientY){
    const pad = 14;
    const rect = d.hoverPopup.getBoundingClientRect();
    let x = clientX + pad;
    let y = clientY + pad;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if(x + rect.width + pad > vw) x = clientX - rect.width - pad;
    if(y + rect.height + pad > vh) y = clientY - rect.height - pad;

    d.hoverPopup.style.left = `${Math.max(pad, x)}px`;
    d.hoverPopup.style.top  = `${Math.max(pad, y)}px`;
  };

  App.hideHoverPopup = function(){
    d.hoverPopup.style.display = 'none';
    d.hoverPopupImg.src = '';
    d.hoverPopupTitle.textContent = '';
  };

  App.bindHoverPopupOnce = function(el){
    if(!el || el.dataset.hoverBound === '1') return;
    el.dataset.hoverBound = '1';

    el.addEventListener('mouseenter', (e) => {
      const unitKey = el.dataset.callIn || '';
      if(unitKey) App.showHoverPopupForUnit(unitKey, e.clientX, e.clientY);
    });

    el.addEventListener('mousemove', (e) => {
      if(d.hoverPopup.style.display === 'block'){
        App.positionHoverPopup(e.clientX, e.clientY);
      }
    });

    el.addEventListener('mouseleave', App.hideHoverPopup);
  };

  App.bindCallInPreviewOnce = function(el){
    if(!el || el.dataset.previewBound === '1') return;
    el.dataset.previewBound = '1';

    if(App.isCoarsePointer){
      // Capture-phase click handler so badge taps don't also pick the upgrade
      el.addEventListener('click', (e) => {
        const unitKey = el.dataset.callIn || '';
        if(!unitKey) return;

        // Only intercept taps on the badge
        const tappedBadge =
          e.target && e.target.classList && e.target.classList.contains('tap-hint');

        if(tappedBadge){
          e.preventDefault();
          e.stopPropagation();
          App.openUnitSheet(unitKey);
        }
        // else: allow normal card onclick (upgrade pick) to run
      }, true);
    } else {
      App.bindHoverPopupOnce(el);
    }
  };

  App.setCallInTarget = function(el, unitKey){
    if(!el) return;
    if(unitKey) el.dataset.callIn = unitKey;
    else {
      delete el.dataset.callIn;
      App.hideHoverPopup();
    }
  };

  // ---------- Unit sheet (tap / modal) ----------
  App.openUnitSheet = function(unitKey){
    const info = App.getUnitPopupInfo(unitKey);
    if(!info) return;

    d.unitSheetTitle.textContent = info.title;
    d.unitSheetImg.src = info.src;
    App.applyAspectClass(d.unitSheetImg);

    d.unitSheet.setAttribute('aria-hidden', 'false');
  };

  App.closeUnitSheet = function(){
    d.unitSheet.setAttribute('aria-hidden', 'true');
    d.unitSheetImg.src = '';
    d.unitSheetTitle.textContent = '';
  };

  // Bind sheet close once
  if(d.unitSheetClose && !d.unitSheetClose.dataset.bound){
    d.unitSheetClose.dataset.bound = '1';
    d.unitSheetClose.onclick = App.closeUnitSheet;
  }
  if(d.unitSheet && !d.unitSheet.dataset.bound){
    d.unitSheet.dataset.bound = '1';
    d.unitSheet.onclick = (e) => { if(e.target === d.unitSheet) App.closeUnitSheet(); };
  }

 App.ensureTapHint = function ensureTapHint(el){
  if(!el) return;

  // Allow badge on picker cards too
  if(
    !el.classList.contains('upgrade-card') &&
    !el.classList.contains('upgrade-tile') &&
    !el.classList.contains('picker-card')
  ) return;

  let badge = el.querySelector(':scope > .tap-hint');
  if(badge) return;

  badge = document.createElement('div');
  badge.className = 'tap-hint';
  badge.textContent = 'CALL-IN';
  el.appendChild(badge);
};

App.removeTapHint = function removeTapHint(el){
  if(!el) return;
  const badge = el.querySelector(':scope > .tap-hint');
  if(badge) badge.remove();
};


  console.log('[boot] hover.js Loaded.');
})();
