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
    st.items = [];
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
    d.pickerBackBtn.style.display = 'none';
    d.pickerRerollBtn.style.display = 'none';

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

    // label (optional)
   /*  if(item.label){
      const label = document.createElement('div');
      label.className = 'rarity-label';
      label.textContent = item.label;
      card.appendChild(label);
    } */

    // locked (optional)
    if(item.locked) card.classList.add('locked');

    // call-in optional
    applyCallIn(card, item);

    return card;
  }

  // --- Grid render (desktop) ---
  function renderGrid(items){
    d.pickerGrid.innerHTML = '';

    items.forEach((item) => {
      const rarity = item.rarity ? ` ${item.rarity}` : '';
      const card = buildCardEl(item, `upgrade-card${rarity}`);

      card.onclick = () => {
        if(item.locked) return;
        if(st.onPick) st.onPick(item);
      };

      d.pickerGrid.appendChild(card);
    });
  }

  // --- Carousel render (mobile) ---
let animTimer = null;

function setIndex(next){
  const max = st.items.length - 1;
  st.activeIndex = App.clamp(next, 0, Math.max(0, max));

  if(d.pickerTrack._setDragIndex) d.pickerTrack._setDragIndex(st.activeIndex);

  const step = App.getTrackStepPx(d.pickerTrack, '.picker-slide') || d.pickerCarousel.clientWidth;
  const x = -st.activeIndex * step;

  // Cancel any pending "remove animating" from earlier swipes
  if(animTimer) clearTimeout(animTimer);

  // Reset transition state cleanly
  d.pickerTrack.classList.remove('is-animating');
  // force reflow so the next class-add definitely re-enables transition
  void d.pickerTrack.offsetWidth;

  d.pickerTrack.classList.add('is-animating');

  // Use rAF to avoid batching issues (prevents skipped transitions)
  requestAnimationFrame(() => {
    d.pickerTrack.style.transform = `translateX(${x}px)`;
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

        if(st.onFocusPick) st.onFocusPick(item);
        else if(st.onPick) st.onPick(item);
      });

      slide.appendChild(card);
      d.pickerTrack.appendChild(slide);
    });

    App.bindSwipeTrackOnce(
      d.pickerTrack,
      () => items.length,
      () => App.getTrackStepPx(d.pickerTrack, '.picker-slide'),
      (i) => setIndex(i)
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
   *   onFocusPick?: (item) => void,  // optional override for mobile focused tap
   *   back?: { show: true, text?: string, onClick: fn },
   *   reroll?: { show: true, text: string, onClick: fn }
   * })
   */
  App.picker.open = function openPicker(cfg){
    const items = Array.isArray(cfg.items) ? cfg.items : [];
	
	// grid column control (desktop only)
	d.pickerGrid.classList.remove('grid-2','grid-3','grid-4','grid-5');
	if(cfg.gridCols){
	  d.pickerGrid.classList.add(`grid-${cfg.gridCols}`);
	}

    st.items = items;
    st.onPick = typeof cfg.onPick === 'function' ? cfg.onPick : null;
    st.onFocusPick = typeof cfg.onFocusPick === 'function' ? cfg.onFocusPick : null;

    d.pickerTitle.textContent = cfg.title || 'Pick';
    d.pickerSubTitle.textContent = cfg.subTitle || '';
	
	bindArrowClicksOnce();
	
    // footer buttons
    if(cfg.back && cfg.back.show){
      d.pickerBackBtn.style.display = 'inline-block';
      d.pickerBackBtn.textContent = cfg.back.text || 'Back';
      d.pickerBackBtn.onclick = cfg.back.onClick || null;
    } else {
      d.pickerBackBtn.style.display = 'none';
      d.pickerBackBtn.onclick = null;
    }

    if(cfg.reroll && cfg.reroll.show){
      d.pickerRerollBtn.style.display = 'inline-block';
      d.pickerRerollBtn.textContent = cfg.reroll.text || 'Re-roll';
      d.pickerRerollBtn.onclick = cfg.reroll.onClick || null;
    } else {
      d.pickerRerollBtn.style.display = 'none';
      d.pickerRerollBtn.onclick = null;
    }

    // choose render mode
    if(App.isCoarsePointer){
      d.pickerCarousel.style.display = 'block';
      d.pickerGrid.style.display = 'none';
      renderCarousel(items);
    } else {
      d.pickerCarousel.style.display = 'none';
      d.pickerGrid.style.display = 'grid';
      renderGrid(items);
    }

    show();
  };
})();
