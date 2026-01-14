// js/utils.js
(() => {
  const App = window.App;

  App.clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  App.applyAspectClass = function(imgEl){
    if(!imgEl) return;
    imgEl.classList.add('aspect-aware');

    const set = () => {
      const nw = imgEl.naturalWidth || 0;
      const nh = imgEl.naturalHeight || 0;
      if(!nw || !nh) return;
      const portrait = nh > nw;
      imgEl.classList.toggle('portrait', portrait);
      imgEl.classList.toggle('landscape', !portrait);
    };

    if(imgEl.complete) set();
    else imgEl.addEventListener('load', set, { once:true });
  };

  App.getTrackStepPx = function(trackEl, slideSelector){
    const slide = trackEl.querySelector(slideSelector);
    if(!slide) return 0;
    const rect = slide.getBoundingClientRect();
    const style = getComputedStyle(trackEl);
    const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    return rect.width + gap;
  };

  App.setActiveCard = function(trackEl, cardSelector, activeIndex){
    const cards = trackEl.querySelectorAll(cardSelector);
    cards.forEach((c, i) => c.classList.toggle('is-active', i === activeIndex));
  };

  App.bindSwipeTrackOnce = function(trackEl, getCount, getStep, onSetIndex){
    if(trackEl.dataset.swipeBound === '1') return;
    trackEl.dataset.swipeBound = '1';

    const drag = { active:false, startX:0, lastX:0, baseX:0, step:0, idx:0 };

    trackEl.addEventListener('pointerdown', (e) => {
      drag.active = true;
      drag.startX = e.clientX;
      drag.lastX = e.clientX;
      drag.step = getStep();
      drag.baseX = -drag.idx * drag.step;
      trackEl.classList.remove('is-animating');
      trackEl.setPointerCapture(e.pointerId);
    });

    trackEl.addEventListener('pointermove', (e) => {
      if(!drag.active) return;
      drag.lastX = e.clientX;
      const dx = e.clientX - drag.startX;

      let x = drag.baseX + dx;

      const count = getCount();
      const minX = -(count - 1) * drag.step;
      const maxX = 0;

      if(x > maxX) x = maxX + (x - maxX) * 0.25;
      if(x < minX) x = minX + (x - minX) * 0.25;

      trackEl.style.transform = `translateX(${x}px)`;
    });

    trackEl.addEventListener('pointerup', () => {
      if(!drag.active) return;
      drag.active = false;

      const dx = drag.lastX - drag.startX;
      const step = drag.step || getStep();
      const threshold = Math.min(90, step * 0.22);

      let next = drag.idx;
      if(dx < -threshold) next = drag.idx + 1;
      if(dx >  threshold) next = drag.idx - 1;

      onSetIndex(next);
    });

    trackEl.addEventListener('pointercancel', () => {
      if(!drag.active) return;
      drag.active = false;
      onSetIndex(drag.idx);
    });

    trackEl._setDragIndex = (i) => { drag.idx = i; };
  };
  
  App.weightedPickOne = function(items, getWeight){
	  let total = 0;
	  const weights = items.map(it => {
		const w = Math.max(0, Number(getWeight(it)) || 0);
		total += w;
		return w;
	  });
	  if(total <= 0) return null;

	  let r = Math.random() * total;
	  for(let i=0; i<items.length; i++){
		r -= weights[i];
		if(r <= 0) return items[i];
	  }
	  return items[items.length - 1];
	};

	App.getOwnedState = function(){
	  return {
		upgrades: App.selectedUpgradeKeys,         // Set of upgrade keys
		units: new Set(App.activeBuildSlots.filter(Boolean)) // active slot unit IDs
	  };
	};
	
	App.getUnitSynergyMultiplier = function(unitId){
	  const u = App.unitCatalog?.units?.[unitId];
	  if(!u) return 1;

	  const prefs = u.preferences || {};
	  const owned = App.getOwnedState();

	  let mult = 1;

	  const fromUp = prefs.fromUpgrades || {};
	  for(const upKey of owned.upgrades){
		if(fromUp[upKey]) mult *= Number(fromUp[upKey]) || 1;
	  }

	  const fromUnits = prefs.fromUnits || {};
	  for(const unitKey of owned.units){
		if(fromUnits[unitKey]) mult *= Number(fromUnits[unitKey]) || 1;
	  }

	  return mult;
	};

})();
