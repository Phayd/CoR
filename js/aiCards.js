// js/aiCards.js
(() => {
 console.log('[boot] aiCards.js Loading...');
  const App = window.App;
  const d = App.dom;

  // ---- DOM (adjust IDs if yours differ) ----
  const btnP1 = document.getElementById('aiCardBtn');
  const btnP2 = document.getElementById('aiCardBtnP2');

  const modal = document.getElementById('aiCardModal');          // your AI modal container
  const modalClose = document.getElementById('closeAICardModal'); // your close X
  const refreshBtn = document.getElementById('aiCardRefreshBtn'); // refresh button in modal
  
  // ref modal close wiring
  const refModal = document.getElementById('aiRefModal');
  const refContent = document.getElementById('aiRefModalContent');
  const refClose = document.getElementById('closeAIRefModal');

  // ---- State ----
  App.ai = App.ai || {};
  App.ai.pool = App.ai.pool || []; // [{ key, filename, phase }]
  App.ai.activeByPhase = App.ai.activeByPhase || { 1: null, 2: null };
  App.ai.openPhase = App.ai.openPhase || 1;
  App.ai.activeCard = null;
  

  // ---- Loaders ----
  App.loadAICardsOnce = App.loadAICardsOnce || (async function loadAICardsOnce(){
    if(App.ai.pool.length) return;

    // expects something like:
    // { items: { "ai_action_x": { filename:"...", phase:1 }, ... } }
    const data = await App.loadJson('AICards/index.json');

    const items = (data && data.items && typeof data.items === 'object') ? data.items : {};
    App.ai.pool = Object.entries(items)
      .filter(([,v]) => v && v.filename)
      .map(([key, v]) => ({
        key,
        filename: v.filename,
        phase: Number(v.phase) || 1,
		  refs: [
			normRef(v.Ref1 ?? v.ref1),
			normRef(v.Ref2 ?? v.ref2),
			normRef(v.Ref3 ?? v.ref3),
			normRef(v.Ref4 ?? v.ref4),
		  ],
      }));
  });

  App.openModal= function(){
    if(modal) modal.style.display = 'flex';
  };
  App.closeModal=function(){
    if(modal) modal.style.display = 'none';
  };

  App.pickRandomForPhase = function(phase, excludeKey){
    const elig = App.ai.pool.filter(x => x.phase === phase && x.key !== excludeKey);
    if(!elig.length) return null;
    return elig[Math.floor(Math.random() * elig.length)];
  };

  App.getActiveCardForPhase = function(phase){
    const activeKey = App.ai.activeByPhase[phase];
    if(activeKey){
      const found = App.ai.pool.find(x => x.key === activeKey);
      if(found) return found;
    }
    const picked = App.pickRandomForPhase(phase, null);
    if(picked) App.ai.activeByPhase[phase] = picked.key;
    return picked;
  };

	App.renderCard = function(card){
	  if(!card || !d.aiCardModalImg) return;
	  d.aiCardModalImg.src = `AICards/${card.filename}`;
	  App.applyAspectClass?.(d.aiCardModalImg);
	};
	
	App.renderAICard = function(card){
		if(!card) return;
	  
	  App.ai.activeCard = card;

	  const img = document.getElementById('aiCardModalImg');
	  img.src = `AICards/${card.filename}`;
	  App.applyAspectClass?.(img);
	  
	  if(d.aiCardStage) d.aiCardStage.dataset.cardKey = card.key;

	  // Optionally: hide hotspots that have no ref
	  document.querySelectorAll('.ai-hotspot').forEach(btn => {
		const n = Number(btn.dataset.ref) || 0;
		const path = card.refs?.[n-1] || null;
		btn.style.display = path ? 'block' : 'none';
	  });
	};
	
	App.openAIRef = function(path){
	  const modal = document.getElementById('aiRefModal');
	  const img = document.getElementById('aiRefImg');
	  img.src = path;
	  App.applyAspectClass?.(img);
	  modal.style.display = 'flex';
	};

App.closeAIRef= function(){
  const modal = document.getElementById('aiRefModal');
  const img = document.getElementById('aiRefImg');
  modal.style.display = 'none';
  img.src = '';
};

 App.bindAIHotspotsOnce = function bindAIHotspotsOnce(){
    const stage = d.aiCardStage;
    if(!stage || stage.dataset.hotspotsBound === '1') return;
    stage.dataset.hotspotsBound = '1';

    stage.addEventListener('click', (e) => {
	  const btn = e.target.closest('.ai-hotspot');
	  if(!btn) return;

	  const n = Number(btn.dataset.ref) || 0; // 1..4
	  if(n < 1 || n > 4) return;

	  // Use the current rendered card
	  const card = App.ai.activeCard;
	  if(!card) return;

	  const refPath = card.refs?.[n - 1] || null;
	  if(!refPath) return;

	  e.preventDefault();
	  e.stopPropagation();

	  // Use your AI ref modal (you already wrote it)
	  App.openAIRef(refPath);
	});


  if(refClose && !refClose.dataset.bound){
    refClose.dataset.bound = '1';
    refClose.onclick = App.closeAIRef;
  }
  if(refModal && !refModal.dataset.bound){
    refModal.dataset.bound = '1';
    refModal.onclick = (e) => { if(e.target === refModal) App.closeAIRef(); };
  }
  if(refContent && !refContent.dataset.bound){
    refContent.dataset.bound = '1';
    refContent.onclick = (e) => e.stopPropagation();
  }
};


 async function launchPhase(phase){
  await App.loadAICardsOnce();

  App.ai.openPhase = phase;

  const card = App.getActiveCardForPhase(phase);
  if(card) App.renderAICard(card);

  App.openModal();             // or openModal()

  App.bindAIHotspotsOnce();          // bind after modal content is in DOM
}


  async function refreshCurrentPhase(){
	  await App.loadAICardsOnce();
	  const phase = App.ai.openPhase || 1;

	  const next =
		App.pickRandomForPhase(phase, App.ai.activeByPhase[phase]) ||
		App.getActiveCardForPhase(phase);

	  if(next){
		App.ai.activeByPhase[phase] = next.key;
		App.renderAICard(next);      // ✅ updates activeCard + refs + dataset.cardKey + hides empty hotspots
	  }
	}

  
  function normRef(v){
  if(typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.replaceAll('\\','/') : null;
}

  // ---- Bindings ----
  if(btnP1 && !btnP1.dataset.bound){
    btnP1.dataset.bound = '1';
    btnP1.addEventListener('click', () => launchPhase(1));
  }

  if(btnP2 && !btnP2.dataset.bound){
    btnP2.dataset.bound = '1';
    btnP2.addEventListener('click', () => launchPhase(2));
  }

  if(refreshBtn && !refreshBtn.dataset.bound){
    refreshBtn.dataset.bound = '1';
    refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      refreshCurrentPhase();
    });
  }

  if(modalClose && !modalClose.dataset.bound){
    modalClose.dataset.bound = '1';
    modalClose.addEventListener('click', App.closeModal);
  }

  if(modal && !modal.dataset.bound){
    modal.dataset.bound = '1';
    modal.addEventListener('click', (e) => { if(e.target === modal) App.closeModal(); });
  }
   console.log('[boot] aiCards.js Loaded');

})();
