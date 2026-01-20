// js/commanderFactionPicker.js
(() => {
  const App = window.App;
  const d = App.dom;

  const FACTIONS = [
	  { key:'us',  name:'United States', icon:'Commanders/us_logo.png' },
	  { key:'uk',  name:'Britain', icon:'Commanders/uk_logo.png' },
	  { key:'su',  name:'Soviet Union', icon:'Commanders/su_logo.png' },
	  { key:'wm', name:'Wehrmacht', icon:'Commanders/wm_logo.png' },
	  { key:'ok',  name:'Oberkommando West', icon:'Commanders/ok_logo.png' },
	];

  function getCommanderThumbSrc(cmd){
    return `Commanders/${cmd.filename}`;
  }

  function selectCommander(cmd){
    // XP cost
    App.updateXP(-cmd.xp);

    // set tile image
    // (if you already store the chosen src elsewhere, do that too)
    if(d.commanderTile){
      d.commanderTile.innerHTML = '';
      const img = document.createElement('img');
      img.src = getCommanderThumbSrc(cmd);
      d.commanderTile.appendChild(img);
      d.commanderTile.dataset.commanderKey = cmd.key;
      d.commanderTile.dataset.commanderSrc = img.src;
    }

    // gating state
    App.activeCommanderKey = cmd.key;

	if(App.dom.aiLaunchers) App.dom.aiLaunchers.classList.remove('is-hidden');

    const su = Array.isArray(cmd.startingUnits) ? cmd.startingUnits : [];
    App.activeBuildSlots = [su[0] || null, su[1] || null];
    App.activeBuildableUnits = new Set(su);

    // reveal panels
    d.upgradesSection?.classList.remove('upgrades-hidden');
    d.buildablePanel?.classList.remove('buildable-dim');
    d.commanderTile?.classList.remove('commander-emphasis');

    App.populateBuildSlots(App.activeBuildSlots);
  }

  function openFactionPicker(){
    // Build 5 “cards” for picker
    const items = FACTIONS.map(f => ({
      key: f.key,
      title: f.name,
      imgSrc: f.icon
    }));

    App.picker.open({
      title: 'Choose Faction',
      subtitle: 'Swipe to browse. Tap to select.',
      mode: 'carousel', // your generic picker can ignore this if it auto-decides
	  gridCols: 5,
      items,
      // Render: big icon + name
      renderItem: (it) => ({
        imgSrc: it.img,
        label: it.title
      }),
      // Tap: go to commanders filtered
      onPick: (it) => {
        App.picker.close?.();
        openCommanderPickerForFaction(it.key);
      },
      // No reroll/back on this screen
      showBack: false,
      showReroll: false
    });
  }

  function openCommanderPickerForFaction(factionKey){
    const all = Array.isArray(App.commanderPool) ? App.commanderPool : [];
    const filtered = all.filter(c => (c.faction || 'unknown') === factionKey);

    // If empty, fall back or show message
    if(!filtered.length){
      App.picker.open({
        title: 'No Commanders Found',
        subtitle: `No commanders are tagged with faction "${factionKey}".`,
        items: [],
        showBack: true,
        onBack: () => { App.picker.close?.(); openFactionPicker(); }
      });
      return;
    }

    const items = filtered.map(cmd => ({
      key: cmd.key,
      cmd,
      title: cmd.key,      // optional
      xp: cmd.xp,
      imgSrc: getCommanderThumbSrc(cmd),
    }));

    App.picker.open({
      title: 'Choose Commander',
      subtitle: 'Swipe to browse. Tap the focused commander to select.',
      items,
	  gridCols: 5,
      renderItem: (it) => ({
        imgSrc: it.img,
        label: `${it.xp}xp`
      }),
      canPick: (it) => (App.xp >= it.xp),
      onPick: (it) => {
        if(App.xp < it.xp) return;
        selectCommander(it.cmd);
        App.picker.close?.();
      },
      showBack: true,
      onBack: () => { App.picker.close?.(); openFactionPicker(); },
      showReroll: false
    });
  }

  // commanderTile click behavior
  function bindCommanderTile(){
    if(!d.commanderTile || d.commanderTile.dataset.bound === '1') return;
    d.commanderTile.dataset.bound = '1';

    d.commanderTile.addEventListener('click', async () => {
      // If already selected -> open image viewer instead (your new behavior)
      const chosenSrc = d.commanderTile.dataset.commanderSrc;
      if(chosenSrc){
		App.picker?.close?.();
        App.openImageViewer?.({ title: 'Commander', src: chosenSrc });
        return;
      }

      // Otherwise open faction picker -> filtered commander picker
      await App.loadCommandersOnce?.();
      openFactionPicker();
    });
  }

  // init
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindCommanderTile);
  } else {
    bindCommanderTile();
  }
})();
