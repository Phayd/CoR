// js/buildSlots.js
(() => {
  const App = window.App;
  const d = App.dom;

  App.resetBuildSlots = function resetBuildSlots(){
    const s1 = d.buildSlot1;
    const s2 = d.buildSlot2;

    if(s1){
      s1.textContent = 'Select a Commander to Load Units';
      s1.classList.add('build-slot-placeholder');
    }
    if(s2){
      s2.textContent = 'Select a Commander to Load Units';
      s2.classList.add('build-slot-placeholder');
    }
  };

  App.renderUnitIntoSlot = function renderUnitIntoSlot(slotEl, unitDef){
    if(!slotEl) return;

    slotEl.classList.remove('build-slot-placeholder');
    slotEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'center';
    wrap.style.justifyContent = 'center';
    wrap.style.gap = '8px';
    wrap.style.width = '100%';
    wrap.style.height = '100%';
    wrap.style.boxSizing = 'border-box';
    wrap.style.padding = '6px';

    const name = document.createElement('div');
    name.textContent = (unitDef && unitDef.name) ? unitDef.name : 'Unknown Unit';
    name.style.fontSize = '16px';
    name.style.fontWeight = '700';
    name.style.letterSpacing = '1px';
    name.style.textTransform = 'uppercase';
    name.style.padding = '6px 10px';
    name.style.border = '1px solid var(--khaki)';
    name.style.background = 'rgba(0,0,0,0.55)';
    name.style.width = '100%';
    name.style.boxSizing = 'border-box';
    name.style.textAlign = 'center';
    wrap.appendChild(name);

    if(unitDef && unitDef.card){
      const img = document.createElement('img');
      img.src = `Units/${unitDef.card}`;
      img.classList.add('aspect-aware');
      App.applyAspectClass(img);
      wrap.appendChild(img);
    }

    slotEl.appendChild(wrap);
  };

  App.populateBuildSlots = async function populateBuildSlots(startingUnits){
    await App.loadUnitCatalogOnce();

    const s1 = d.buildSlot1;
    const s2 = d.buildSlot2;
    if(!s1 || !s2) return;

    const ids = Array.isArray(startingUnits) ? startingUnits : [];
    if(!ids.length){
      App.resetBuildSlots();
      return;
    }

    const catalog = App.unitCatalog && App.unitCatalog.units ? App.unitCatalog.units : {};
    const u1 = ids[0] ? catalog[ids[0]] : null;
    const u2 = ids[1] ? catalog[ids[1]] : null;

    App.renderUnitIntoSlot(s1, u1 || { name: ids[0] || '—', card: null });
    App.renderUnitIntoSlot(s2, u2 || { name: ids[1] || '—', card: null });

    if(ids.length > 2){
      const more = document.createElement('div');
      more.textContent = `+${ids.length - 2} more`;
      more.style.marginTop = '6px';
      more.style.fontSize = '12px';
      more.style.opacity = '0.85';
      s2.appendChild(more);
    }
  };
  console.log('[boot] buildSlots.js Loaded.');
})();
