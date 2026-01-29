// js/boot.js
(() => {
  const App = window.App;
  const d = App.dom;

App.updateXP = function(delta){
  if(App._xpIgnoreEnabled && delta < 0) return; // ignore costs
  App.xp = Math.max(0, App.xp + delta);
  d.xpValueEl.textContent = `XP: ${App.xp}`;
};


  // XP buttons
  d.xpPlus.onclick = () => App.updateXP(1);
  d.xpMinus.onclick = () => App.updateXP(-1);

  // Optional: Ignore costs checkbox (do NOT return if missing)
  if(d?.xpIgnoreCosts && d.xpIgnoreCosts.dataset.bound !== '1'){
    d.xpIgnoreCosts.dataset.bound = '1';

	d.xpIgnoreCosts.addEventListener('change', () => {
	const enforce = d.xpIgnoreCosts.checked;

	// Minimize / expand XP panel UI (keep checkbox visible)
	const panel = d.xpIgnoreCosts.closest('.xp-panel');
	if(panel) panel.classList.toggle('xp-minimized', !enforce);

  if(!enforce){
    if(App._xpBeforeIgnore == null) App._xpBeforeIgnore = Number(App.xp) || 0;
    App._xpIgnoreEnabled = true;
    App.xp = 1000;         // still “behind the scenes”
    // DON'T call App.updateXP(0); (we're hiding the display anyway)
  } else {
    App._xpIgnoreEnabled = false;
    App.xp = (App._xpBeforeIgnore == null) ? (Number(App.xp) || 0) : App._xpBeforeIgnore;
    App._xpBeforeIgnore = null;
    App.updateXP(0);       // refresh visible XP when expanded again
  }
});

  }

  // BOOT (always runs)
  (async () => {
    App.updateXP(0);
    App.resetBuildSlots?.();
    try{
      await App.loadCommandersOnce?.();
      await App.loadUpgradesOnce?.();
      await App.loadUnitCatalogOnce?.();
    }catch(e){
      console.warn(e);
    }
  })();
})();
