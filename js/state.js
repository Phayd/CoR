// js/state.js
(() => {
  const App = window.App;

  App.xp = 30;
  App.rerollCost = 1;

  App.activeBuildSlots = [null, null];
  App.unitSwapTriggerCount = 0;

  App.pendingSwapTier = null;
  App.pendingNewUnit = null;
  App.pendingUnitChoices = [];

  App.commanderPool = [];
  App.upgradePools = { common: [], veteran: [], elite: [], legendary: [] };
  App.selectedUpgradeKeys = new Set();

  App.unitCatalog = null;

  App.activeCommanderKey = null;
  App.activeBuildableUnits = new Set();

  App.RARITY_WEIGHTS = { common: 60, veteran: 30, elite: 9, legendary: 1 };

  App.TIER_2_UNLOCK_COUNT = 3;
  App.TIER_3_UNLOCK_COUNT = 6;

  App.getUnlockedTier = function(){
    const n = App.selectedUpgradeKeys.size;
    if(n >= App.TIER_3_UNLOCK_COUNT) return 3;
    if(n >= App.TIER_2_UNLOCK_COUNT) return 2;
    return 1;
  };

  App.isCoarsePointer =
    window.matchMedia('(any-pointer: coarse)').matches &&
    !window.matchMedia('(any-pointer: fine)').matches;
})();
