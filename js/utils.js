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

App.bindSwipeTrackOnce = function(trackEl, getCount, getStep, onSetIndex, extraCfg){
  // Always update the live callbacks + optional config (important!)
  trackEl._swipeCfg = Object.assign({}, extraCfg || {}, { getCount, getStep, onSetIndex });

  // If already bound, we're done. The listeners will use _swipeCfg.
  if(trackEl.dataset.swipeBound === '1') return;
  trackEl.dataset.swipeBound = '1';

  const drag = { active:false, startX:0, lastX:0, baseX:0, step:0, idx:0 };

  function readCurrentX(){
    const inlineX = App.parseTranslateX(trackEl.style.transform);
    if(Number.isFinite(inlineX)) return inlineX;

    const computedX = App.parseTranslateX(getComputedStyle(trackEl).transform);
    if(Number.isFinite(computedX)) return computedX;

    return 0;
  }

 function resolveCenterOffset(cfg, stepFallback){
  const viewportEl =
    (typeof cfg.getViewportEl === 'function'
      ? cfg.getViewportEl()
      : trackEl.parentElement);

  const slideSelector = cfg.slideSelector || '.picker-slide';

  if (typeof App.getCenterOffset === 'function' && viewportEl){
    return App.getCenterOffset(trackEl, viewportEl, slideSelector);
  }

  // hard fallback (should rarely hit)
  const viewportW = viewportEl?.getBoundingClientRect().width || 0;
  const slideEl = trackEl.querySelector(slideSelector);
  const slideW = slideEl?.getBoundingClientRect().width || stepFallback || viewportW;
  return (viewportW - slideW) / 2;
}

  trackEl.addEventListener('pointerdown', (e) => {
    const cfg = trackEl._swipeCfg;

    drag.active = true;
    drag.startX = e.clientX;
    drag.lastX  = e.clientX;
    drag.step   = cfg.getStep();

    drag.baseX = readCurrentX();

    const count = cfg.getCount();
    const centerOffset = resolveCenterOffset(cfg, drag.step);

    drag.idx = drag.step
      ? App.clamp(Math.round((centerOffset - drag.baseX) / drag.step), 0, Math.max(0, count - 1))
      : 0;

    trackEl.classList.remove('is-animating');
    trackEl.setPointerCapture?.(e.pointerId);
  });

  trackEl.addEventListener('pointermove', (e) => {
    if(!drag.active) return;
    const cfg = trackEl._swipeCfg;

    drag.lastX = e.clientX;
    const dx = e.clientX - drag.startX;

    let x = drag.baseX + dx;

    const count = cfg.getCount();
    const step = drag.step || cfg.getStep();
    if(!step) return;

    const centerOffset = resolveCenterOffset(cfg, step);

	const minX = -(count - 1) * step;
	const maxX = 0;


    if(x > maxX) x = maxX + (x - maxX) * 0.25;
    if(x < minX) x = minX + (x - minX) * 0.25;

    trackEl.style.transform = `translateX(${x}px)`;
  });

  trackEl.addEventListener('pointerup', () => {
    if(!drag.active) return;
    drag.active = false;

    const cfg = trackEl._swipeCfg;

    const step = drag.step || cfg.getStep();
    if(!step) return;

    const dx = drag.lastX - drag.startX;
    let x  = drag.baseX + dx;

    const count = cfg.getCount();
    const centerOffset = resolveCenterOffset(cfg, step);

    const minX = centerOffset - (count - 1) * step;
    const maxX = centerOffset;

    if(x > maxX) x = maxX + (x - maxX) * 0.25;
    if(x < minX) x = minX + (x - minX) * 0.25;

    const next = App.clamp(
      Math.round(-x / step),
      0,
      Math.max(0, count - 1)
    );

    drag.idx = next;
    cfg.onSetIndex(next);
  });

  trackEl.addEventListener('pointercancel', () => {
    if(!drag.active) return;
    drag.active = false;
    trackEl._swipeCfg.onSetIndex(drag.idx);
  });

  trackEl._setDragIndex = (i) => { drag.idx = i; };
};

  
  App.weightedPickOne = function(items, getWeight){
	  let total = 0;
	  items = App.shuffleArray(items);
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
	
	App.parseTranslateX = function parseTranslateX(t){
	  if(!t || t === 'none') return null;

	  // translateX(-123px)
	  let m = t.match(/translateX\(\s*([-0-9.]+)px\s*\)/i);
	  if(m){
		const x = Number(m[1]);
		return Number.isFinite(x) ? x : null;
	  }

	  // translate3d(-123px, 0px, 0px)
	  m = t.match(/translate3d\(\s*([-0-9.]+)px\s*,/i);
	  if(m){
		const x = Number(m[1]);
		return Number.isFinite(x) ? x : null;
	  }

	  // matrix(a,b,c,d,tx,ty)
	  m = t.match(/matrix\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([-0-9.]+),/i);
	  if(m){
		const x = Number(m[1]);
		return Number.isFinite(x) ? x : null;
	  }

	  // matrix3d(..., tx, ty, tz)
	  m = t.match(/matrix3d\((.+)\)/i);
	  if(m){
		const parts = m[1].split(',').map(s => Number(s.trim()));
		if(parts.length === 16 && Number.isFinite(parts[12])) return parts[12]; // m41
	  }

	  return null;
	};

App.getCenterOffset = function(trackEl, viewportEl, slideSelector){
  if(!trackEl || !viewportEl) return 0;

  const slide = trackEl.querySelector(slideSelector);
  if(!slide) return 0;

  const vpRect = viewportEl.getBoundingClientRect();
  const slRect = slide.getBoundingClientRect();

  const cs = getComputedStyle(viewportEl);
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;

  const viewportW = vpRect.width - pl - pr;
  const slideW = slRect.width;

  return pl + (viewportW - slideW) / 2;
};

App.spawnFloatingXP = function(anchorEl, text){
  if(!anchorEl) return;

  const r = anchorEl.getBoundingClientRect();

  const el = document.createElement('div');
  el.className = 'floating-xp';
  
  el.textContent = text;

  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top  = `${r.top - 4}px`;

  document.body.appendChild(el);

  el.addEventListener('animationend', () => {
    el.remove();
  });
};

App.shuffleArray = function (arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

})();
