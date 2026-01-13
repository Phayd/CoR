// js/commanderModal.js
(() => {
  const App = window.App;
  const d = App.dom;
	console.log('[boot] commanderModal.js Loading...');

  // commander carousel state
  App.cmd = App.cmd || {};
  App.cmd.activeIndex = 0;
  App.cmd.drag = { active:false, startX:0, lastX:0, baseX:0, step:0 };

  // --- helpers ---
  App.setCommanderImage = function(src){
    d.commanderTile.innerHTML = '';
    const img = document.createElement('img');
    img.src = src;
    d.commanderTile.appendChild(img);
  };

  App.openCommanderModal = function(){ d.commanderModal.style.display = 'flex'; };
  App.closeCommanderModal = function(){
    d.commanderModal.style.display = 'none';
    d.commanderTrack.classList.remove('is-animating');
  };

  App.getCmdStepPx = function(){
    const slide = d.commanderTrack.querySelector('.cmd-slide');
    if(!slide) return d.commanderCarousel.clientWidth;

    const slideRect = slide.getBoundingClientRect();
    const trackStyle = getComputedStyle(d.commanderTrack);
    const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;

    return slideRect.width + gap;
  };

  // This is what you *meant* by "setApp.cmd.activeIndex"
  App.cmd.setActiveIndex = function(next){
    const max = App.commanderPool.length - 1;
    App.cmd.activeIndex = App.clamp(next, 0, Math.max(0, max));

    const step = App.getCmdStepPx();
    const x = -App.cmd.activeIndex * step;

    d.commanderTrack.classList.add('is-animating');
    d.commanderTrack.style.transform = `translateX(${x}px)`;

    const cards = d.commanderTrack.querySelectorAll('.cmd-card');
    cards.forEach((c, i) => c.classList.toggle('is-active', i === App.cmd.activeIndex));

    setTimeout(() => d.commanderTrack.classList.remove('is-animating'), 300);
  };

  App.buildCommanderCarousel = function(){
    d.commanderTrack.innerHTML = '';
    App.cmd.activeIndex = 0;

    App.commanderPool.forEach((item, idx) => {
      const slide = document.createElement('div');
      slide.className = 'cmd-slide';

      const card = document.createElement('div');
      card.className = 'cmd-card';
      card.dataset.index = String(idx);

      const img = document.createElement('img');
      img.src = `Commanders/${item.filename}`;
      card.appendChild(img);

      const label = document.createElement('div');
      label.className = 'rarity-label';
      label.textContent = `${item.xp}xp`;
      card.appendChild(label);

      card.addEventListener('click', async () => {
        const i = Number(card.dataset.index) || 0;

        // tap non-active card = focus it
        if(i !== App.cmd.activeIndex){
          App.cmd.setActiveIndex(i);
          return;
        }

        // tap active = attempt select
        const canAfford = App.xp >= item.xp;
        if(!canAfford) return;

        App.updateXP(-item.xp);
        App.setCommanderImage(img.src);
		App.selectedCommander = { key: item.key, src: img.src };


        App.activeCommanderKey = item.key;
        const su = Array.isArray(item.startingUnits) ? item.startingUnits : [];
        App.activeBuildSlots = [su[0] || null, su[1] || null];
        App.activeBuildableUnits = new Set(su);

        d.upgradesSection.classList.remove('upgrades-hidden');
        d.buildablePanel.classList.remove('buildable-dim');
        d.commanderTile.classList.remove('commander-emphasis');

        await App.populateBuildSlots(App.activeBuildSlots);
        App.closeCommanderModal();
      });

      slide.appendChild(card);
      d.commanderTrack.appendChild(slide);
    });

    requestAnimationFrame(() => App.cmd.setActiveIndex(0));
  };

  App.bindCommanderSwipeOnce = function(){
    if(d.commanderTrack.dataset.swipeBound === '1') return;
    d.commanderTrack.dataset.swipeBound = '1';

    d.commanderTrack.addEventListener('pointerdown', (e) => {
      App.cmd.drag.active = true;
      App.cmd.drag.startX = e.clientX;
      App.cmd.drag.lastX = e.clientX;

      const step = App.getCmdStepPx();
      App.cmd.drag.step = step;
      App.cmd.drag.baseX = -App.cmd.activeIndex * step;

      d.commanderTrack.classList.remove('is-animating');
      d.commanderTrack.setPointerCapture(e.pointerId);
    });

    d.commanderTrack.addEventListener('pointermove', (e) => {
      if(!App.cmd.drag.active) return;
      App.cmd.drag.lastX = e.clientX;

      const dx = e.clientX - App.cmd.drag.startX;
      let x = App.cmd.drag.baseX + dx;

      const step = App.cmd.drag.step || App.getCmdStepPx();
      const count = App.commanderPool.length;

      const minX = -(Math.max(0, count - 1)) * step;
      const maxX = 0;

      if(x > maxX) x = maxX + (x - maxX) * 0.25;
      if(x < minX) x = minX + (x - minX) * 0.25;

      d.commanderTrack.style.transform = `translateX(${x}px)`;
    });

    d.commanderTrack.addEventListener('pointerup', () => {
      if(!App.cmd.drag.active) return;
      App.cmd.drag.active = false;

      const dx = App.cmd.drag.lastX - App.cmd.drag.startX;
      const step = App.cmd.drag.step || App.getCmdStepPx();
      const threshold = Math.min(90, step * 0.18);

      let next = App.cmd.activeIndex;
      if(dx < -threshold) next = App.cmd.activeIndex + 1;
      if(dx >  threshold) next = App.cmd.activeIndex - 1;

      App.cmd.setActiveIndex(next);
    });

    d.commanderTrack.addEventListener('pointercancel', () => {
      if(!App.cmd.drag.active) return;
      App.cmd.drag.active = false;
      App.cmd.setActiveIndex(App.cmd.activeIndex);
    });
  };

  // --- modal wiring ---
  if(d.closeCommanderModal && !d.closeCommanderModal.dataset.bound){
    d.closeCommanderModal.dataset.bound = '1';
    d.closeCommanderModal.onclick = App.closeCommanderModal;
  }
  if(d.commanderModal && !d.commanderModal.dataset.bound){
    d.commanderModal.dataset.bound = '1';
    d.commanderModal.onclick = (e) => { if(e.target === d.commanderModal) App.closeCommanderModal(); };
  }
  if(d.commanderModalContent && !d.commanderModalContent.dataset.bound){
    d.commanderModalContent.dataset.bound = '1';
    d.commanderModalContent.onclick = (e) => e.stopPropagation();
  }

  // tile click handler
  // commanderTile click
d.commanderTile.onclick = async () => {
  // already selected => open image viewer
  if(App.activeCommanderKey && App.selectedCommander?.src){
    App.openImageViewer({ src: App.selectedCommander.src, title: 'Commander' });
    return;
  }

  await App.loadCommandersOnce();

  const items = App.commanderPool.map(item => ({
    id: item.key,
    imgSrc: `Commanders/${item.filename}`,
    label: `${item.xp}xp`,
    locked: App.xp < item.xp,
    meta: item,
  }));

  App.picker.open({
    title: 'Select Your Commander',
    subTitle: 'Swipe to View Commanders, Tap to Select.',
    items,
    onPick: async (it) => {
      const item = it.meta;

      App.updateXP(-item.xp);
      App.selectedCommander = { key: item.key, src: it.imgSrc };

      App.activeCommanderKey = item.key;
      const su = Array.isArray(item.startingUnits) ? item.startingUnits : [];
      App.activeBuildSlots = [su[0] || null, su[1] || null];
      App.activeBuildableUnits = new Set(su);

      d.upgradesSection.classList.remove('upgrades-hidden');
      d.buildablePanel.classList.remove('buildable-dim');
      d.commanderTile.classList.remove('commander-emphasis');

      App.setCommanderImage?.(it.imgSrc);
      await App.populateBuildSlots(App.activeBuildSlots);

      App.picker.close();
    }
  });
};
console.log('[boot] commanderModal.js Loaded.');
})();
