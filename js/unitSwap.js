// js/unitSwap.js
(() => {
  const App = window.App;
  const d = App.dom;
  
  console.log('[boot] unitSwap.js');

  // ---------- Modal open/close ----------
  App.openUnitSwapModal = function openUnitSwapModal(){
    d.unitSwapModal.style.display = 'flex';
  };

  App.closeUnitSwapModal = function closeUnitSwapModal(){
    d.unitSwapModal.style.display = 'none';

    App.pendingSwapTier = null;
    App.pendingNewUnit = null;
    App.pendingUnitChoices = [];
	App.rerollCost = 1;


    d.unitSwapGrid.innerHTML = '';
    d.unitReplaceGrid.innerHTML = '';

    d.unitReplaceGrid.style.display = 'none';
    d.unitSwapGrid.style.display = 'grid';
    d.unitSwapBackBtn.style.display = 'none';

    if(d.unitSwapCarousel) d.unitSwapCarousel.style.display = 'none';
    if(d.unitReplaceCarousel) d.unitReplaceCarousel.style.display = 'none';
  };

  // ---------- Modal close wiring (once) ----------
  if(d.closeUnitSwapModal && !d.closeUnitSwapModal.dataset.bound){
    d.closeUnitSwapModal.dataset.bound = '1';
    d.closeUnitSwapModal.onclick = App.closeUnitSwapModal;
  }
  if(d.unitSwapModal && !d.unitSwapModal.dataset.bound){
    d.unitSwapModal.dataset.bound = '1';
    d.unitSwapModal.onclick = (e) => { if(e.target === d.unitSwapModal) App.closeUnitSwapModal(); };
  }
  if(d.unitSwapModalContent && !d.unitSwapModalContent.dataset.bound){
    d.unitSwapModalContent.dataset.bound = '1';
    d.unitSwapModalContent.onclick = (e) => e.stopPropagation();
  }
  if(d.unitSwapCancelBtn && !d.unitSwapCancelBtn.dataset.bound){
    d.unitSwapCancelBtn.dataset.bound = '1';
    d.unitSwapCancelBtn.onclick = App.closeUnitSwapModal;
  }
  if(d.unitSwapBackBtn && !d.unitSwapBackBtn.dataset.bound){
    d.unitSwapBackBtn.dataset.bound = '1';
    d.unitSwapBackBtn.onclick = () => {
      // Back to choose-new-unit step
      App.pendingNewUnit = null;
      d.unitReplaceGrid.style.display = 'none';
      d.unitSwapGrid.style.display = 'grid';
      d.unitSwapBackBtn.style.display = 'none';
      App.renderUnitSwapChoicesStep();
    };
  }

  // ---------- Helpers ----------
  App.getUnitTier = function getUnitTier(unitId){
    const u = App.unitCatalog && App.unitCatalog.units ? App.unitCatalog.units[unitId] : null;
    const t = u && u.tier != null ? Number(u.tier) : 1;
    return Number.isFinite(t) ? t : 1;
  };

  App.buildUnitCard = function buildUnitCard(unitId, subtitle){
    const u = App.unitCatalog.units[unitId];

    const card = document.createElement('div');
    card.className = 'upgrade-card unit-option-card';

    const img = document.createElement('img');
    img.src = `Units/${u.card}`;
    App.applyAspectClass(img);

    const label = document.createElement('div');
    label.className = 'rarity-label';
    label.textContent = u.name || unitId;

    card.appendChild(img);
    card.appendChild(label);

    if(subtitle){
      const sub = document.createElement('div');
      sub.className = 'unit-subtitle';
      sub.textContent = subtitle;
      card.appendChild(sub);
    }

    return card;
  };

  App.pickTwoUnitsForTier = function(tier){
  const all = Object.entries(App.unitCatalog.units || {})
    .filter(([id, u]) => u && u.card)
    .filter(([id]) => !App.activeBuildableUnits.has(id))
    .filter(([id]) => App.getUnitTier(id) === tier)
    .map(([id]) => id);

  if(all.length < 2) return all;

  const first = App.weightedPickOne(all, (id) => App.getUnitSynergyMultiplier(id));
  const remaining = all.filter(x => x !== first);
  const second = App.weightedPickOne(remaining, (id) => App.getUnitSynergyMultiplier(id));
  return [first, second].filter(Boolean);
};


  // ---------- Render steps ----------
  App.renderUnitSwapChoicesStep = function renderUnitSwapChoicesStep(){
    d.unitSwapTitle.textContent = `Reinforcements (Tier ${App.pendingSwapTier})`;
    d.unitSwapStepText.textContent = 'Swipe to view. Tap the focused unit to choose.';
    d.unitSwapBackBtn.style.display = 'none';

    d.unitSwapGrid.innerHTML = '';
    d.unitReplaceGrid.innerHTML = '';
    d.unitReplaceGrid.style.display = 'none';

    // Desktop grid (fine pointer)
    if(!App.isCoarsePointer){
      d.unitSwapGrid.style.display = 'grid';
      for(const id of App.pendingUnitChoices){
        const card = App.buildUnitCard(id, 'Tap to add');
        card.onclick = () => { App.pendingNewUnit = id; App.renderUnitSwapReplaceStep(); };
        d.unitSwapGrid.appendChild(card);
      }
      if(d.unitSwapCarousel) d.unitSwapCarousel.style.display = 'none';
      if(d.unitReplaceCarousel) d.unitReplaceCarousel.style.display = 'none';
      return;
    }

    // Mobile carousel
    d.unitSwapGrid.style.display = 'none';
    if(d.unitReplaceCarousel) d.unitReplaceCarousel.style.display = 'none';
    if(d.unitSwapCarousel) d.unitSwapCarousel.style.display = 'block';
    d.unitSwapTrack.innerHTML = '';

    let activeIndex = 0;

    App.pendingUnitChoices.forEach((id, idx) => {
      const u = App.unitCatalog.units[id];

      const slide = document.createElement('div');
      slide.className = 'us-slide';

      const card = document.createElement('div');
      card.className = 'us-card';
      card.dataset.index = String(idx);

      const img = document.createElement('img');
      img.src = `Units/${u.card}`;
      App.applyAspectClass(img);

      const label = document.createElement('div');
      label.className = 'rarity-label';
      label.textContent = u.name || id;

      card.appendChild(img);
      card.appendChild(label);

      card.addEventListener('click', () => {
        if(idx !== activeIndex){
          setIndex(idx);
          return;
        }
        App.pendingNewUnit = id;
        App.renderUnitSwapReplaceStep();
      });

      slide.appendChild(card);
      d.unitSwapTrack.appendChild(slide);
    });

    const getStep = () => App.getTrackStepPx(d.unitSwapTrack, '.us-slide');

	function setIndex(next){
	  const max = App.pendingUnitChoices.length - 1;
	  activeIndex = Math.max(0, Math.min(max, next));
	  d.unitSwapTrack._setDragIndex?.(activeIndex);

	  const viewportEl = d.unitSwapCarousel || d.unitSwapTrack.parentElement;

	  const step =
		getStep() ||
		(viewportEl?.getBoundingClientRect().width || d.unitSwapCarousel.clientWidth);

	  const centerOffset = App.getCenterOffset
		? App.getCenterOffset(d.unitSwapTrack, viewportEl, '.us-slide')
		: 0;

	  d.unitSwapTrack.classList.add('is-animating');
	  d.unitSwapTrack.style.transform = `translateX(${-activeIndex * step}px)`;
	  App.setActiveCard(d.unitSwapTrack, '.us-card', activeIndex);
	  setTimeout(() => d.unitSwapTrack.classList.remove('is-animating'), 300);
	}

	App.bindSwipeTrackOnce(
	  d.unitSwapTrack,
	  () => App.pendingUnitChoices.length,
	  getStep,
	  (i) => setIndex(i),
	  {
		slideSelector: '.us-slide',
		getViewportEl: () => d.unitSwapCarousel || d.unitSwapTrack.parentElement
	  }
	);

    requestAnimationFrame(() => setIndex(0));
  };

  App.renderUnitSwapReplaceStep = function renderUnitSwapReplaceStep(){
    const newU = App.unitCatalog.units[App.pendingNewUnit];
    d.unitSwapTitle.textContent = `Add: ${newU?.name || App.pendingNewUnit}`;
    d.unitSwapStepText.textContent = 'Swipe to choose a slot. Tap focused slot to replace.';
    d.unitSwapBackBtn.style.display = 'inline-block';

    // Desktop flow
    if(!App.isCoarsePointer){
      d.unitSwapGrid.style.display = 'none';
      d.unitReplaceGrid.style.display = 'grid';
      d.unitReplaceGrid.innerHTML = '';

      for(let idx=0; idx<2; idx++){
        const oldId = App.activeBuildSlots[idx];
        const subtitle = oldId ? `Replace Slot ${idx+1}` : `Fill Slot ${idx+1}`;

        const card = (oldId && App.unitCatalog.units[oldId])
          ? App.buildUnitCard(oldId, subtitle)
          : (() => {
              const c = document.createElement('div');
              c.className = 'upgrade-card unit-option-card';
              c.style.display = 'flex';
              c.style.alignItems = 'center';
              c.style.justifyContent = 'center';
              c.textContent = `Empty Slot ${idx+1}`;
              return c;
            })();

        card.onclick = async () => {
          const prev = App.activeBuildSlots[idx];
          App.activeBuildSlots[idx] = App.pendingNewUnit;

          App.activeBuildableUnits = new Set(App.activeBuildableUnits);
          if(prev) App.activeBuildableUnits.delete(prev);
          App.activeBuildableUnits.add(App.pendingNewUnit);

          await App.populateBuildSlots(App.activeBuildSlots);
          App.closeUnitSwapModal();
        };

        d.unitReplaceGrid.appendChild(card);
      }

      if(d.unitSwapCarousel) d.unitSwapCarousel.style.display = 'none';
      if(d.unitReplaceCarousel) d.unitReplaceCarousel.style.display = 'none';
      return;
    }

    // Mobile carousel flow
    if(d.unitSwapCarousel) d.unitSwapCarousel.style.display = 'none';
    if(d.unitReplaceCarousel) d.unitReplaceCarousel.style.display = 'block';
    d.unitReplaceTrack.innerHTML = '';

    let activeIndex = 0;

    for(let idx=0; idx<2; idx++){
      const oldId = App.activeBuildSlots[idx];

      const slide = document.createElement('div');
      slide.className = 'us-slide';

      const card = document.createElement('div');
      card.className = 'us-card';
      card.dataset.index = String(idx);

      if(oldId && App.unitCatalog.units[oldId]){
        const oldU = App.unitCatalog.units[oldId];

        const img = document.createElement('img');
        img.src = `Units/${oldU.card}`;
        App.applyAspectClass(img);

        const label = document.createElement('div');
        label.className = 'rarity-label';
        label.textContent = `Slot ${idx+1}: ${oldU.name || oldId}`;

        card.appendChild(img);
        card.appendChild(label);
      } else {
        const label = document.createElement('div');
        label.className = 'rarity-label';
        label.textContent = `Slot ${idx+1}: Empty`;
        card.appendChild(label);
      }

      card.addEventListener('click', async () => {
        if(idx !== activeIndex){
          setIndex(idx);
          return;
        }

        const prev = App.activeBuildSlots[idx];
        App.activeBuildSlots[idx] = App.pendingNewUnit;

        App.activeBuildableUnits = new Set(App.activeBuildableUnits);
        if(prev) App.activeBuildableUnits.delete(prev);
        App.activeBuildableUnits.add(App.pendingNewUnit);

        await App.populateBuildSlots(App.activeBuildSlots);
        App.closeUnitSwapModal();
      });

      slide.appendChild(card);
      d.unitReplaceTrack.appendChild(slide);
    }

    const getStep = () => App.getTrackStepPx(d.unitReplaceTrack, '.us-slide');

	function setIndex(next){
	  activeIndex = Math.max(0, Math.min(1, next));
	  d.unitReplaceTrack._setDragIndex?.(activeIndex);

	  const viewportEl = d.unitReplaceCarousel || d.unitReplaceTrack.parentElement;

	  const step =
		getStep() ||
		(viewportEl?.getBoundingClientRect().width || d.unitReplaceCarousel.clientWidth);

	  const centerOffset = App.getCenterOffset
		? App.getCenterOffset(d.unitReplaceTrack, viewportEl, '.us-slide')
		: 0;

	  d.unitReplaceTrack.classList.add('is-animating');
	  d.unitReplaceTrack.style.transform = `translateX(-activeIndex * step}px)`;
	  App.setActiveCard(d.unitReplaceTrack, '.us-card', activeIndex);
	  setTimeout(() => d.unitReplaceTrack.classList.remove('is-animating'), 300);
	}

	App.bindSwipeTrackOnce(
	  d.unitReplaceTrack,
	  () => 2,
	  getStep,
	  (i) => setIndex(i),
	  {
		slideSelector: '.us-slide',
		getViewportEl: () => d.unitReplaceCarousel || d.unitReplaceTrack.parentElement
	  }
	);

    requestAnimationFrame(() => setIndex(0));
  };

  // ---------- Trigger ----------
 App.maybeTriggerUnitSwap = async function(){
  if(!App.activeCommanderKey) return;
  const count = App.selectedUpgradeKeys.size;
  if(count === 0 || (count !== 8 && ((count % 3) !== 0))) return;
  await App.openUnitSwapFlow();
};

App.openUnitSwapFlow = async function(){
  await App.loadUnitCatalogOnce();
  if(App.pendingUnitChoices?.length){
    console.warn('openUnitSwapFlow called with active swap state');
  }

  App.unitSwapTriggerCount += 1;
  App.pendingSwapTier = (App.unitSwapTriggerCount === 1) ? 2 : 3;

  App.rerollCost = 1;
  App.openUnitSwapChoicePicker();
};

App.openUnitSwapChoiceFromState = function(){
  if(!App.pendingUnitChoices || App.pendingUnitChoices.length < 2) return;

  const tier = App.pendingSwapTier;
  const choices = App.pendingUnitChoices;

  const items = choices.map(id => {
    const u = App.unitCatalog.units[id];
    return {
      id,
      imgSrc: `Units/${u.card}`,
      label: u.name || id,
      meta: { unitId: id }
    };
  });

  App.picker.open({
    title: `TIER ${tier} REINFORCEMENTS UNLOCKED`,
    subTitle: 'CHOOSE NEW CORE UNIT',
    items,
    gridCols: 2,

    showReroll: true,
    rerollText: `Re-roll (-${App.rerollCost} XP)`,

    onReroll: () => {
      if(App.xp < App.rerollCost){
        App.picker.flashDenied?.();
        return;
      }

      App.updateXP(-App.rerollCost);
      App.rerollCost++;

      // 🔁 explicit reroll only happens here
      App.openUnitSwapChoicePicker();
    },

    onPick: (it) => {
      App.pendingNewUnit = it.id;
      App.openUnitSwapReplaceStep();
    }
  });
};


App.openUnitSwapChoicePicker = function(){
  const tier = App.pendingSwapTier;

  const choices = App.pickTwoUnitsForTier(tier);
  if(choices.length < 2) return;

  App.pendingUnitChoices = choices;
  App.pendingNewUnit = null;

  const items = choices.map(id => {
    const u = App.unitCatalog.units[id];
    return {
      id,
      imgSrc: `Units/${u.card}`,
      label: u.name || id,
      meta: { unitId: id }
    };
  });

  App.picker.open({
    title: `TIER ${tier} REINFORCEMENTS UNLOCKED`,
    subTitle: 'CHOOSE NEW CORE UNIT',
    items,
    gridCols: 2,

    showReroll: true,
    rerollText: `Re-roll (-${App.rerollCost} XP)`,

    onReroll: () => {
      if(App.xp < App.rerollCost){
        App.picker.flashDenied?.(); // see UI section
        return;
      }

      App.updateXP(-App.rerollCost);
      App.rerollCost++;

      App.openUnitSwapChoicePicker();
    },

    onPick: (it) => {
      App.pendingNewUnit = it.id;
      App.openUnitSwapReplaceStep();
    }
  });
};



App.openUnitSwapReplaceStep = function openUnitSwapReplaceStep(){
  const newId = App.pendingNewUnit;
  const newU = App.unitCatalog.units[newId];

  const items = [0,1].map(idx => {
    const oldId = App.activeBuildSlots[idx];
    const u = oldId ? App.unitCatalog.units[oldId] : null;
    return {
      id: String(idx),
      imgSrc: u?.card ? `Units/${u.card}` : '',
      label: u ? `Slot ${idx+1}: ${u.name || oldId}` : `Slot ${idx+1}: Empty`,
      meta: { idx, oldId }
    };
  });

  App.picker.open({
    title: `Add: ${newU?.name || newId}`,
    subTitle: 'REPLACE OLD CORE UNIT',
    items,
	gridCols: 2,
    showBack: true,
    onBack: () => App.openUnitSwapChoiceFromState(), // go back to step1
    onPick: async (it) => {
      const idx = it.meta.idx;
      const prev = App.activeBuildSlots[idx];

      App.activeBuildSlots[idx] = newId;

      App.activeBuildableUnits = new Set(App.activeBuildableUnits);
      if(prev) App.activeBuildableUnits.delete(prev);
      App.activeBuildableUnits.add(newId);

      await App.populateBuildSlots(App.activeBuildSlots);
      App.picker.close();
    }
  });
};

})();
