// js/boot.js
(() => {
  const App = window.App;
  const d = App.dom;

  App.updateXP = function(delta){
    App.xp = Math.max(0, App.xp + delta);
    d.xpValueEl.textContent = `XP: ${App.xp}`;
  };

  d.xpPlus.onclick = () => App.updateXP(1);
  d.xpMinus.onclick = () => App.updateXP(-1);

  (async () => {
    App.updateXP(0);
    App.resetBuildSlots?.();
    try{
      await App.loadCommandersOnce();
      await App.loadUpgradesOnce();
      await App.loadUnitCatalogOnce();
    }catch(e){
      console.warn(e);
    }
  })();
})();
