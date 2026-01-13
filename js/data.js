// js/data.js
(() => {
  const App = window.App;

  App.loadJson = async function(path){
    const res = await fetch(path, { cache: 'no-store' });
    if(!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
    return res.json();
  };

  App.loadCommandersOnce = async function(){
    if(App.commanderPool.length) return;
    const data = await App.loadJson('Commanders/index.json');

    const itemsObj = (data && data.items && typeof data.items === 'object') ? data.items : {};
    for(const [key, it] of Object.entries(itemsObj)){
      if(it && it.filename){
        App.commanderPool.push({
          key,
          filename: it.filename,
          xp: Number(it.xp) || 0,
          startingUnits: Array.isArray(it.startingUnits) ? it.startingUnits : []
        });
      }
    }
  };

  App.loadUpgradesOnce = async function(){
    const rarities = ['common', 'veteran', 'elite', 'legendary'];
    for(const r of rarities){
      if(App.upgradePools[r].length) continue;

      const data = await App.loadJson(`Upgrades/${r}/index.json`);
      const items = Array.isArray(data.items) ? data.items : [];

      App.upgradePools[r] = items
        .filter(it => it && it.key && it.filename)
        .map(it => ({
          key: it.key,
          filename: it.filename,
          xp: Number(it.xp) || 0,
          tier: Math.max(1, Number(it.tier) || 1),
          preferences: (it.preferences && typeof it.preferences === 'object') ? it.preferences : null,
		  callIn: (typeof it['call-in'] === 'string' && it['call-in'].trim()) ? it['call-in'].trim() : null,
          rarity: r,
          requiresAnyUnits: Array.isArray(it.requiresAnyUnits) ? it.requiresAnyUnits : [],
          requiresAnyCommanders: Array.isArray(it.requiresAnyCommanders) ? it.requiresAnyCommanders : [],
          requiresAnyUpgrades: Array.isArray(it.requiresAnyUpgrades) ? it.requiresAnyUpgrades : []
		  
        }));
    }
  };

  App.loadUnitCatalogOnce = async function(){
    if(App.unitCatalog) return;
    try{
      const data = await App.loadJson('Units/index.json');
      App.unitCatalog = (data && data.units) ? data : { units: {} };
    }catch(e){
      console.warn('Units catalog not found or failed to load Units/index.json', e);
      App.unitCatalog = { units: {} };
    }
  };
})();


