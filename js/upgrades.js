// js/upgrades.js
(() => {
  const App = window.App;
  const d = App.dom;
  console.log('[boot] upgrades.js Loading...');

  // Slot reuse state (persistent)
  App.upgradeChoiceSlots = App.upgradeChoiceSlots || []; // { card, img, label }
  App.noUpgradesMsgEl = App.noUpgradesMsgEl || null;

  // ---------- Modal open/close ----------
  App.openUpgradeModal = function(){
    d.upgradeModal.style.display = 'flex';
  };

  App.closeUpgradeModal = function(){
    d.upgradeModal.style.display = 'none';
    App.rerollCost = 1;
    d.rerollBtn.textContent = `Re-roll (-${App.rerollCost} XP)`;
    d.rerollBtn.classList.remove('reroll-danger');
    if(App.hideHoverPopup) App.hideHoverPopup();
  };

  // Modal close wiring (once)
  if(d.closeUpgradeModal && !d.closeUpgradeModal.dataset.bound){
    d.closeUpgradeModal.dataset.bound = '1';
    d.closeUpgradeModal.onclick = App.closeUpgradeModal;
  }
  if(d.upgradeModal && !d.upgradeModal.dataset.bound){
    d.upgradeModal.dataset.bound = '1';
    d.upgradeModal.onclick = (e) => { if(e.target === d.upgradeModal) App.closeUpgradeModal(); };
  }
  if(d.upgradeModalContent && !d.upgradeModalContent.dataset.bound){
    d.upgradeModalContent.dataset.bound = '1';
    d.upgradeModalContent.onclick = (e) => e.stopPropagation();
  }

  // ---------- Eligibility ----------
  App.meetsAnyOfRequirements = function(upgrade){
    const reqUnits = upgrade.requiresAnyUnits || [];
    const reqCmds  = upgrade.requiresAnyCommanders || [];
    const reqUps   = upgrade.requiresAnyUpgrades || [];

    if(!reqUnits.length && !reqCmds.length && !reqUps.length) return true;

    const unitOk = reqUnits.some(u => App.activeBuildableUnits && App.activeBuildableUnits.has(u));
    const cmdOk  = reqCmds.some(c => c === App.activeCommanderKey);
    const upOk   = reqUps.some(k => App.selectedUpgradeKeys && App.selectedUpgradeKeys.has(k));

    return unitOk || cmdOk || upOk;
  };

  App.meetsTierRequirement = function(upgrade){
    return (Number(upgrade.tier) || 1) <= App.getUnlockedTier();
  };

  App.rollRarity = function(){
    const entries = Object.entries(App.RARITY_WEIGHTS || {});
    const total = entries.reduce((s, [,w]) => s + (Number(w) || 0), 0) || 1;
    const r = Math.random() * total;

    let acc = 0;
    for(const [rarity, weight] of entries){
      acc += (Number(weight) || 0);
      if(r <= acc) return rarity;
    }
    return 'common';
  };

  App.eligibleUpgradesForRarity = function(rarity, exclude){
    const pool = (App.upgradePools && App.upgradePools[rarity]) ? App.upgradePools[rarity] : [];
    return pool
      .filter(u => u && u.key && u.filename)
      .filter(u => !App.selectedUpgradeKeys.has(u.key))
      .filter(u => !exclude.has(u.key))
      .filter(App.meetsTierRequirement)
      .filter(App.meetsAnyOfRequirements);
  };

  App.eligibleAnyRarity = function(exclude){
    const all = App.upgradePools ? Object.values(App.upgradePools).flat() : [];
    return all
      .filter(u => u && u.key && u.filename)
      .filter(u => !App.selectedUpgradeKeys.has(u.key))
      .filter(u => !exclude.has(u.key))
      .filter(App.meetsTierRequirement)
      .filter(App.meetsAnyOfRequirements);
  };

	App.pickOneUpgrade = function pickOneUpgrade(exclude){
	  for(let attempt=0; attempt<12; attempt++){
		const rarity = App.rollRarity();
		const elig = App.eligibleUpgradesForRarity(rarity, exclude);
		if(elig.length){
		  // weighted pick
		  if(App.weightedPickOne){
			const picked = App.weightedPickOne(elig, (u) => App.getUpgradePickMultiplier(u));
			if(picked) return picked;
		  }
		  // fallback
		  return elig[Math.floor(Math.random() * elig.length)];
		}
	  }

	  const any = App.eligibleAnyRarity(exclude);
	  if(!any.length) return null;

	  if(App.weightedPickOne){
		const picked = App.weightedPickOne(any, (u) => App.getUpgradePickMultiplier(u));
		if(picked) return picked;
	  }

	  return any[Math.floor(Math.random() * any.length)];
	};


  // ---------- Slot reuse init ----------
  App.initUpgradeChoiceSlotsOnce = function(){
    if(App.upgradeChoiceSlots.length) return;

    // Persistent "no upgrades" message
    App.noUpgradesMsgEl = document.createElement('p');
    App.noUpgradesMsgEl.textContent = 'No eligible upgrades remaining.';
    App.noUpgradesMsgEl.style.display = 'none';
    d.upgradeGrid.appendChild(App.noUpgradesMsgEl);

    // Create exactly 3 persistent cards
    for(let i=0; i<3; i++){
      const card = document.createElement('div');
      card.className = 'upgrade-card common';
      card.style.display = 'none';

      const img = document.createElement('img');
      img.src = '';
      App.applyAspectClass(img);

      const label = document.createElement('div');
      label.className = 'rarity-label';
      label.textContent = '';

      card.appendChild(img);
      card.appendChild(label);
      d.upgradeGrid.appendChild(card);

      // hover/tap preview binding once
      if(App.bindCallInPreviewOnce) App.bindCallInPreviewOnce(card);

      App.upgradeChoiceSlots.push({ card, img, label });
    }
  };

  // ---------- Render choices ----------
  App.renderUpgradeChoices = function(){
    App.initUpgradeChoiceSlotsOnce();

	  const picked = computePickedUpgrades();

	  // No upgrades
	  if(!picked.length){
		if(App.isCoarsePointer){
		  App.renderUpgradeCarouselChoices(picked);
		} else {
		  // your existing desktop behavior:
		  // show noUpgradesMsgEl and hide slots
		  App.noUpgradesMsgEl.style.display = 'block';
		  for(const slot of App.upgradeChoiceSlots){
			slot.card.style.display = 'none';
			slot.card.onclick = null;
		  }
		}
		return;
	  }

	  // Mobile: carousel
	  if(App.isCoarsePointer){
		App.renderUpgradeCarouselChoices(picked);
		return;
	  }
	  
    // Hide all slots by default
    for(const slot of App.upgradeChoiceSlots){
      slot.card.style.display = 'none';
      slot.card.onclick = null;
      slot.card.classList.remove('locked', 'common', 'veteran', 'elite', 'legendary', 'legendary-reveal');

      if(App.setCallInTarget) App.setCallInTarget(slot.card, null);
      if(App.removeTapHint) App.removeTapHint(slot.card);
    }
    if(App.noUpgradesMsgEl) App.noUpgradesMsgEl.style.display = 'none';

    const exclude = new Set();

    for(let i=0;i<3;i++){
      const u = App.pickOneUpgrade(exclude);
      if(!u) break;
	  console.log("[upgrades.js:renderUpgradeChoices] Chose:",u.key);
      picked.push(u);
      exclude.add(u.key);
    }

    if(!picked.length){
      if(App.noUpgradesMsgEl) App.noUpgradesMsgEl.style.display = 'block';
      return;
    }

    for(let i=0;i<picked.length;i++){
      const u = picked[i];
      const slot = App.upgradeChoiceSlots[i];

      // call-in target + badge
      if(App.setCallInTarget) App.setCallInTarget(slot.card, u.callIn);
      if(u.callIn) App.ensureTapHint?.(slot.card);
      else App.removeTapHint?.(slot.card);

      // rarity class
      slot.card.classList.add(u.rarity);

      // Legendary slow reveal
      if(u.rarity === 'legendary'){
        slot.card.classList.remove('legendary-reveal');
        void slot.card.offsetWidth; // restart animation
        slot.card.classList.add('legendary-reveal');
      }

      // image + label
      slot.img.src = `Upgrades/${u.rarity}/${u.filename}`;
      App.applyAspectClass(slot.img);
      slot.label.textContent = `T${u.tier} • ${u.rarity} • ${u.xp}xp`;

      // XP lock
      const canAfford = App.xp >= u.xp;
      if(!canAfford){
        slot.card.classList.add('locked');
        slot.card.onclick = null;
      } else {
        slot.card.classList.remove('locked');
        slot.card.onclick = () => {
          App.updateXP(-u.xp);
          App.selectedUpgradeKeys.add(u.key);

          const tile = document.createElement('div');
          tile.className = `upgrade-tile ${u.rarity}`;

          // call-in preview on carousel tile
          if(App.setCallInTarget) App.setCallInTarget(tile, u.callIn);
          App.bindCallInPreviewOnce?.(tile);
          if(u.callIn) App.ensureTapHint?.(tile);

          const clone = document.createElement('img');
          clone.src = slot.img.src;
          tile.appendChild(clone);
		  
		  tile.addEventListener('click', (e) => {
			// If you have tap-hint badge, don’t steal that click.
			// Let your existing call-in logic handle badge taps.
			if(e.target && e.target.classList && e.target.classList.contains('tap-hint')) return;
	
			 App.openImageViewer({
				src: clone.src,
				title: u.rarity.toUpperCase() + ' UPGRADE',
				callIn: u.callIn || null
			  });
		  });

		  
          d.baseCarousel.insertBefore(tile, d.addUpgradeBtn);

          App.closeUpgradeModal();

          // trigger unit swap after every 3rd upgrade (if module exists)
          App.maybeTriggerUnitSwap?.();
        };
      }

      slot.card.style.display = 'block';
    }
  };

  function computePickedUpgrades()
  {
	  const picked = [];
	  const exclude = new Set();
	  for(let i=0;i<3;i++){
		const u = App.pickOneUpgrade(exclude);
		if(!u) break;
		picked.push(u);
		exclude.add(u.key);
	  }
	  return picked;
  }
	
  App.renderUpgradeCarouselChoices = function renderUpgradeCarouselChoices(picked){
  // show carousel / hide grid
	if(d.upgradeGrid) d.upgradeGrid.style.display = 'grid';
	if(d.upgradeCarousel) d.upgradeCarousel.style.display = 'none';

  d.upgradeTrack.innerHTML = '';

  if(!picked.length){
    d.upgradeTrack.innerHTML = `<p style="opacity:.8;">No eligible upgrades remaining.</p>`;
    return;
  }

  let activeIndex = 0;

  picked.forEach((u, idx) => {
    const slide = document.createElement('div');
    slide.className = 'upg-slide';

    const card = document.createElement('div');
    card.className = `upg-card ${u.rarity}`;
    card.dataset.index = String(idx);

    // call-in badge (if present)
    if(u.callIn){
      App.ensureTapHint?.(card);
      App.setCallInTarget?.(card, u.callIn);
      App.bindCallInPreviewOnce?.(card);
    } else {
      App.removeTapHint?.(card);
      App.setCallInTarget?.(card, null);
    }

    // legendary reveal
    if(u.rarity === 'legendary'){
      card.classList.remove('legendary-reveal');
      void card.offsetWidth;
      card.classList.add('legendary-reveal');
    }

    const img = document.createElement('img');
    img.src = `Upgrades/${u.rarity}/${u.filename}`;
    App.applyAspectClass(img);

    const label = document.createElement('div');
    label.className = 'rarity-label';
    label.textContent = `T${u.tier} • ${u.rarity} • ${u.xp}xp`;

    card.appendChild(img);
    card.appendChild(label);

    // XP lock
    const canAfford = App.xp >= u.xp;
    if(!canAfford) card.classList.add('locked');

    // tap behavior:
    // - tap non-active => focus
    // - tap active => select (unless tap-hint was tapped; preview code captures that)
    card.addEventListener('click', () => {
      if(idx !== activeIndex){
        setIndex(idx);
        return;
      }
      if(!canAfford) return;

      // select upgrade
      App.updateXP(-u.xp);
      App.selectedUpgradeKeys.add(u.key);

      const tile = document.createElement('div');
      tile.className = `upgrade-tile ${u.rarity}`;

      // preserve call-in preview on carousel tile
      App.setCallInTarget?.(tile, u.callIn);
      App.bindCallInPreviewOnce?.(tile);
      if(u.callIn) App.ensureTapHint?.(tile);

      const clone = document.createElement('img');
      clone.src = img.src;
      tile.appendChild(clone);

      d.baseCarousel.insertBefore(tile, d.addUpgradeBtn);

      App.closeUpgradeModal();
      App.maybeTriggerUnitSwap?.();
    });

    slide.appendChild(card);
    d.upgradeTrack.appendChild(slide);
  });

  const getStep = () => App.getTrackStepPx(d.upgradeTrack, '.upg-slide');

	function setIndex(next){
	  const max = picked.length - 1;
	  activeIndex = Math.max(0, Math.min(max, next));
	  d.upgradeTrack._setDragIndex?.(activeIndex);

	  const viewportEl = d.upgradeCarousel || d.upgradeTrack.parentElement;

	  const step =
		getStep() ||
		(viewportEl?.getBoundingClientRect().width || d.upgradeCarousel.clientWidth);

	  const centerOffset = App.getCenterOffset
		? App.getCenterOffset(d.upgradeTrack, viewportEl, '.upg-slide')
		: 0;

	  d.upgradeTrack.classList.add('is-animating');
	  d.upgradeTrack.style.transform = `translateX(${-activeIndex * step}px)`;
	  App.setActiveCard(d.upgradeTrack, '.upg-card', activeIndex);
	  setTimeout(() => d.upgradeTrack.classList.remove('is-animating'), 300);
	}

	App.bindSwipeTrackOnce(
	  d.upgradeTrack,
	  () => picked.length,
	  getStep,
	  (i) => setIndex(i),
	  {
		slideSelector: '.upg-slide',
		getViewportEl: () => d.upgradeCarousel || d.upgradeTrack.parentElement
	  }
	);


  requestAnimationFrame(() => setIndex(0));
};

// Returns a multiplier (>= 0) for how likely an upgrade is to be offered.
// 1.0 = baseline, 1.5 = +50%, 2.0 = +100%, etc.
App.getUpgradePickMultiplier = function getUpgradePickMultiplier(upgrade){
  if(!upgrade || !upgrade.preferences) return 1;

  const prefs = upgrade.preferences;
  let mult = 1;

  // ---- Bias from current buildable units ----
  if(prefs.fromUnits && App.activeBuildableUnits){
    for(const unitId of App.activeBuildableUnits){
      const m = Number(prefs.fromUnits[unitId]);
      if(Number.isFinite(m) && m > 0){
        // Use max instead of multiply to avoid runaway stacking
        mult = mult * m;
      }
    }
  }

  // ---- Bias from already selected upgrades ----
  if(prefs.fromUpgrades && App.selectedUpgradeKeys){
    for(const upgKey of App.selectedUpgradeKeys){
      const m = Number(prefs.fromUpgrades[upgKey]);
      if(Number.isFinite(m) && m > 0){
        mult = mult * m;
      }
    }
  }
  console.log(upgrade.key, 'weight:', mult);
  return mult;
};




  // ---------- Button wiring ----------
  if(d.addUpgradeBtn && !d.addUpgradeBtn.dataset.bound){
    d.addUpgradeBtn.dataset.bound = '1';
    d.addUpgradeBtn.onclick = async () => {
	  await App.loadUpgradesOnce();
	  await App.loadUnitCatalogOnce();

	  App.rerollCost = 1;

	  function makePicked(){
		const picked = [];
		const exclude = new Set();
		for(let i=0;i<3;i++){
		  const u = App.pickOneUpgrade(exclude);
		  if(!u) break;
		  picked.push(u);
		  exclude.add(u.key);
		}
		return picked;
	  }

	  function openChoices(){
		const picked = makePicked();

		const items = picked.map(u => ({
		  id: u.key,
		  imgSrc: `Upgrades/${u.rarity}/${u.filename}`,
		  label: `T${u.tier} • ${u.rarity} • ${u.xp}xp`,
		  rarity: u.rarity,
		  locked: App.xp < u.xp,
		  callIn: u.callIn || null,
		  meta: u
		}));

		App.picker.open({
		  title: 'UPGRADE UNLOCKED',
		  subTitle: 'Swipe to View Upgrades, Tap to Select.',
		  items,
		  gridCols: 3,
		  showReroll: true,
		  // rerollText: `Re-roll (-${App.rerollCost} XP)`,
		  onReroll: () => {
			if(App.xp < App.rerollCost){
			  d.pickerRerollBtn.classList.add('xp-denied');
			  setTimeout(() => d.pickerRerollBtn.classList.remove('xp-denied'), 350);
			  return;
			}
			App.updateXP(-App.rerollCost);
			App.rerollCost++;
			openChoices(); // reopen with new choices
		  },
		  onPick: (it) => {
			const u = it.meta;
			App.updateXP(-u.xp);
			App.selectedUpgradeKeys.add(u.key);

			const tile = document.createElement('div');
			tile.className = `upgrade-tile ${u.rarity}`;
			App.setCallInTarget?.(tile, u.callIn);
			App.bindCallInPreviewOnce?.(tile);
			if(u.callIn) App.ensureTapHint?.(tile);

			const img = document.createElement('img');
			img.src = it.imgSrc;
			tile.appendChild(img);

			d.baseCarousel.insertBefore(tile, d.addUpgradeBtn);

			App.picker.close();
			App.maybeTriggerUnitSwap?.();
		  }
		});
	  }

	  openChoices();
	};

  }

  if(d.rerollBtn && !d.rerollBtn.dataset.bound){
    d.rerollBtn.dataset.bound = '1';
    d.rerollBtn.onclick = () => {
      const cost = Number(App.rerollCost) || 1;

      if(App.xp < cost){
        d.rerollBtn.classList.add('xp-denied');
        setTimeout(() => d.rerollBtn.classList.remove('xp-denied'), 350);
        return;
      }

      App.updateXP(-cost);
      App.rerollCost = cost + 1;

      // d.rerollBtn.textContent = `Re-roll (-${App.rerollCost} XP)`;
      d.rerollBtn.classList.toggle('reroll-danger', App.rerollCost >= 3);

      App.renderUpgradeChoices();
    };
  }
  console.log('[boot] Upgrades.js Loaded.');
})();
