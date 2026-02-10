// js/pickerModal.js
(() => {
  const App = window.App;
  const d = App.dom;

  // Guard: if DOM isn't ready or missing, fail loudly once
  if(!d || !d.pickerModal || !d.pickerTrack || !d.pickerGrid){
    console.warn('pickerModal.js: missing picker modal DOM nodes (check dom.js + HTML)');
    return;
  }

  App.picker = App.picker || {};

  const st = App.picker._state = App.picker._state || {
    items: [],
    activeIndex: 0,
    onPick: null,         // desktop click OR mobile focused click
    onFocusPick: null,    // optional override for "tap focused"
    onBack: null,
    onReroll: null,
  };

  function show(){ d.pickerModal.style.display = 'flex'; }
  function hide(){ d.pickerModal.style.display = 'none'; }

  App.picker.close = function closePicker(){
    // reset state
    st.activeIndex = 0;
    st.onPick = null;
    st.onFocusPick = null;
    st.onBack = null;
    st.onReroll = null;

    // clear UI
    d.pickerTitle.textContent = '';
    d.pickerSubTitle.textContent = '';
    d.pickerGrid.innerHTML = '';
    d.pickerTrack.innerHTML = '';
    d.pickerControlsBackBtn.style.display = 'none';
    d.pickerControlsRerollBtn.style.display = 'none';

    hide();
  };

  // --- close wiring once ---
  if(d.pickerClose && !d.pickerClose.dataset.bound){
    d.pickerClose.dataset.bound = '1';
    d.pickerClose.onclick = App.picker.close;
  }
  if(d.pickerModal && !d.pickerModal.dataset.bound){
    d.pickerModal.dataset.bound = '1';
    d.pickerModal.onclick = (e) => { if(e.target === d.pickerModal) App.picker.close(); };
  }
  if(d.pickerModalContent && !d.pickerModalContent.dataset.bound){
    d.pickerModalContent.dataset.bound = '1';
    d.pickerModalContent.onclick = (e) => e.stopPropagation();
  }

  // --- helpers ---
  function applyCallIn(cardEl, item){
    // item.callIn optional
    if(item && item.callIn && App.setCallInTarget && App.bindCallInPreviewOnce){
      App.setCallInTarget(cardEl, item.callIn);
      App.bindCallInPreviewOnce(cardEl);

      if(App.ensureTapHint) App.ensureTapHint(cardEl);
    } else {
      if(App.setCallInTarget) App.setCallInTarget(cardEl, null);
      if(App.removeTapHint) App.removeTapHint(cardEl);
    }
  }

  function buildCardEl(item, cardClass){
    const card = document.createElement('div');
    card.className = cardClass;

    // image
    const img = document.createElement('img');
    img.src = item.imgSrc || '';
    if(App.applyAspectClass) App.applyAspectClass(img);
    card.appendChild(img);

    // locked (optional)
    if(item.locked) card.classList.add('locked');

    // call-in optional
    applyCallIn(card, item);

    return card;
  }

	function handlePick(item){
	  if(st.rollSticky){
		st.rollSticky = false;
		st.items = [];
	  }

	  if(st.onPick){
		st.onPick(item);
	  }
	}

  // --- Grid render (desktop) ---
  function renderGrid(items){
    d.pickerGrid.innerHTML = '';

    items.forEach((item) => {
      const rarity = item.rarity ? ` ${item.rarity}` : '';
      const card = buildCardEl(item, `upgrade-card${rarity}`);

      card.onclick = () => {
        if(item.locked) return;
        handlePick(item);
      };

      d.pickerGrid.appendChild(card);
    });
  }

  // --- Carousel render (mobile) ---
  let animTimer = null;

  // IMPORTANT: Use the real viewport element (.carousel-viewport), not #pickerCarousel
  function getViewportEl(){
    const shell = d.pickerCarousel ? d.pickerCarousel.closest('.carousel-shell') : null;
    const vp = shell ? shell.querySelector('.carousel-viewport') : null;
    return vp || d.pickerCarousel || d.pickerCarousel?.parentElement || null;
  }

  function setIndex(next){
    const max = st.items.length - 1;
    st.activeIndex = App.clamp(next, 0, Math.max(0, max));

    if(d.pickerTrack._setDragIndex) d.pickerTrack._setDragIndex(st.activeIndex);

    const step =
      App.getTrackStepPx(d.pickerTrack, '.picker-slide') ||
      (getViewportEl()?.getBoundingClientRect().width || d.pickerCarousel.clientWidth);

    // ✅ use shared helper (you’ll add App.getCenterOffset in utils.js)
    const centerOffset = App.getCenterOffset
      ? App.getCenterOffset(d.pickerTrack, getViewportEl(), '.picker-slide')
      : 0;

    // Cancel any pending "remove animating"
    if(animTimer) clearTimeout(animTimer);

    // Reset transition state cleanly
    d.pickerTrack.classList.remove('is-animating');
    void d.pickerTrack.offsetWidth; // force reflow
    d.pickerTrack.classList.add('is-animating');

    requestAnimationFrame(() => {
      d.pickerTrack.style.transform = `translateX(${-st.activeIndex * step}px)`;
    });

    App.setActiveCard(d.pickerTrack, '.picker-card', st.activeIndex);

    animTimer = setTimeout(() => {
      d.pickerTrack.classList.remove('is-animating');
      animTimer = null;
    }, 300);

    updateArrows();
  }

  function updateArrows(){
    const left = d.pickerArrowLeft;
    const right = d.pickerArrowRight;
    if(!left || !right) return;

    const max = st.items.length - 1;
    const i = st.activeIndex;

    // hide arrows entirely if 0-1 items
    const show = max >= 1;
    left.style.display = show ? 'block' : 'none';
    right.style.display = show ? 'block' : 'none';

    left.classList.toggle('disabled', i <= 0);
    right.classList.toggle('disabled', i >= max);
  }

  function bindArrowClicksOnce(){
    const left = d.pickerArrowLeft;
    const right = d.pickerArrowRight;
    if(!left || !right) return;
    if(left.dataset.bound === '1') return;
    left.dataset.bound = '1';
    right.dataset.bound = '1';

    left.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if(left.classList.contains('disabled')) return;
      setIndex(st.activeIndex - 1);
    });

    right.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if(right.classList.contains('disabled')) return;
      setIndex(st.activeIndex + 1);
    });
  }

  function renderCarousel(items){
    d.pickerTrack.innerHTML = '';
    st.activeIndex = 0;

    items.forEach((item, idx) => {
      const slide = document.createElement('div');
      slide.className = 'picker-slide';

      const rarity = item.rarity ? ` ${item.rarity}` : '';
      const card = buildCardEl(item, `picker-card${rarity}`);
      card.dataset.index = String(idx);

      card.addEventListener('click', () => {
        // tap non-focused -> focus
        if(idx !== st.activeIndex){
          setIndex(idx);
          return;
        }
        // tap focused -> pick
        if(item.locked) return;

        if(st.onFocusPick){
		  st.onFocusPick(item);
		} else {
		  handlePick(item);
		}

      });

      slide.appendChild(card);
      d.pickerTrack.appendChild(slide);
    });

    // Bind swipe (your utils bindSwipeTrackOnce should read currentX and call onSetIndex)
	 App.bindSwipeTrackOnce(
	  d.pickerTrack,
	  () => st.items.length,
	  () => App.getTrackStepPx(d.pickerTrack, '.picker-slide'),
	  (i) => setIndex(i),
	  {
		slideSelector: '.picker-slide',
		getViewportEl: () => getViewportEl()
	  }
	);

    requestAnimationFrame(() => setIndex(0));
    updateArrows();
  }

  /**
   * App.picker.open({
   *   title: string,
   *   subTitle?: string,
   *   items: [{ id, imgSrc, label?, rarity?, locked?, callIn?, meta? }],
   *   onPick: (item) => void,
   *   onFocusPick?: (item) => void,
   *   back?: { show: true, text?: string, onClick: fn },
   *   reroll?: { show: true, text: string, onClick: fn },
   *   gridCols?: 2|3|4|5
   * })
   */
  App.picker.open = function openPicker(cfg){
    const items = Array.isArray(cfg.items) ? cfg.items : [];

    // grid column control (desktop only)
    d.pickerGrid.classList.remove('grid-2','grid-3','grid-4','grid-5');
    if(cfg.gridCols){
      d.pickerGrid.classList.add(`grid-${cfg.gridCols}`);
    }

    const useSticky =
	  cfg.useSticky === true &&
	  st.rollSticky === true &&
	  Array.isArray(st.items) &&
	  st.items.length > 0 &&
	  !st.ignoreStickyOnce;

	if(!useSticky){
	  st.items = items || [];
	  st.rollSticky = !!cfg.useSticky;
	}
	
	st.ignoreStickyOnce = false;

    st.onPick = typeof cfg.onPick === 'function' ? cfg.onPick : null;
    st.onFocusPick = typeof cfg.onFocusPick === 'function' ? cfg.onFocusPick : null;

    d.pickerTitle.textContent = cfg.title || 'Pick';
    d.pickerSubTitle.textContent = cfg.subTitle || '';

    bindArrowClicksOnce();

    // choose render mode
    if(App.isCoarsePointer){
      d.pickerCarousel.style.display = 'block';
      d.pickerGrid.style.display = 'none';
      renderCarousel(st.items);
    } else {
      d.pickerCarousel.style.display = 'none';
      d.pickerGrid.style.display = 'grid';
      renderGrid(st.items);
    }
	
		// ----- UI buttons -----
	const headerControls = d.pickerControls;
	const rerollBtn = d.pickerControlsRerollBtn;
	const backBtn = d.pickerControlsBackBtn;

	// Back
	if(cfg.showBack){
	  backBtn.style.display = 'flex';
	  // backBtn.textContent = '<';
	  backBtn.onclick = cfg.onBack || null;
	} else {
	  backBtn.style.display = 'none';
	  backBtn.onclick = null;
	}

	// Reroll
	if(cfg.showReroll){
	  rerollBtn.style.display = 'flex';
	  // rerollBtn.textContent = '⟳';
	  st.onReroll = typeof cfg.onReroll === 'function' ? cfg.onReroll : null;
	} else {
	  rerollBtn.style.display = 'none';
	  rerollBtn.onclick = null;
	  st.onReroll = null;
	}

	// Header visibility
	headerControls.style.display = (cfg.showBack || cfg.showReroll) ? 'flex' : 'none';

    show();
  };
  
  if(d.pickerRerollBtn && !d.pickerRerollBtn.dataset.bound){
  d.pickerRerollBtn.dataset.bound = '1';

  d.pickerRerollBtn.addEventListener('click', () => {
    const btn = d.pickerRerollBtn;

    btn.classList.remove('is-spinning');
    void btn.offsetWidth; // force reflow
    btn.classList.add('is-spinning');
	
	st.ignoreStickyOnce = true;

    if(typeof st.onReroll === 'function'){
		
		if(App.xp < App.rerollCost){
			App.spawnFloatingXP(d.pickerRerollBtn, 'INSUFFICIENT XP');
			d.pickerRerollBtn.classList.add('xp-denied');
			setTimeout(() => d.pickerRerollBtn.classList.remove('xp-denied'), 350);
			return;
		}
		App.spawnFloatingXP(d.pickerRerollBtn,  `-${App.rerollCost} XP`);
      st.onReroll();
    }
  });

  d.pickerRerollBtn.addEventListener('animationend', () => {
    d.pickerRerollBtn.classList.remove('is-spinning');
  });
}



App.picker.flashDenied = function(){
  const btn = d.pickerRerollBtn;
  if(!btn) return;
  btn.classList.add('xp-denied');
  setTimeout(() => btn.classList.remove('xp-denied'), 350);
};


})();
