// js/dom.js
(() => {
  const App = window.App;
  const $ = (id) => document.getElementById(id);
  const must = (id) => {
  const el = document.getElementById(id);
  if(!el) console.warn(`[dom] Missing #${id}`);
  return el;
};


  App.dom = {
	 
	aiLaunchers: $('aiLaunchers'),
	aiCardBtn: $('aiCardBtn'),
	aiCardBtnP2: $('aiCardBtnP2'),
	aiCardStage: $('aiCardStage'),
	aiCardModal: $('aiCardModal'),
	aiCardModalImg: $('aiCardModalImg'),
	closeAICardModal: $('closeAICardModal'),
	aiCardRefreshBtn: $('aiCardRefreshBtn'),

    xpValueEl: must('xpValue'),
    commanderTile: must('commanderTile'),

    upgradesSection: must('upgradesSection'),
    buildablePanel: must('buildablePanel'),

    baseCarousel: must('baseCarousel'),
    addUpgradeBtn: must('addUpgradeBtn'),

    // build slots
    buildSlot1: must('buildSlot1'),
    buildSlot2: must('buildSlot2'),

    // hover popup
    hoverPopup: must('hoverPopup'),
    hoverPopupImg: must('hoverPopupImg'),
    hoverPopupTitle: must('hoverPopupTitle'),

    // unit sheet
    unitSheet: must('unitSheet'),
    unitSheetTitle: must('unitSheetTitle'),
    unitSheetImg: must('unitSheetImg'),
    unitSheetClose: must('unitSheetClose'),

    // buttons
    xpPlus: must('xpPlus'),
    xpMinus: must('xpMinus'),
	
	pickerModal: $('pickerModal'),
	pickerModalContent: $('pickerModalContent'),
	pickerTitle: $('pickerTitle'),
	pickerSubTitle: $('pickerSubTitle'),
	pickerClose: $('pickerClose'),
	pickerGrid: $('pickerGrid'),
	pickerCarousel: $('pickerCarousel'),
	pickerTrack: $('pickerTrack'),
	pickerFooter: $('pickerFooter'),
	pickerBackBtn: $('pickerBackBtn'),
	pickerRerollBtn: $('pickerRerollBtn'),
	pickerArrowLeft: $('pickerArrowLeft'),
	pickerArrowRight: $('pickerArrowRight'),

	
	// image viewer modal
	imageViewerModal: $('imageViewerModal'),
	imageViewerModalContent: $('imageViewerModalContent'),
	imageViewerTitle: $('imageViewerTitle'),
	imageViewerImg: $('imageViewerImg'),
	imageViewerCallInBadge: $('imageViewerCallInBadge'),
	closeImageViewerModal: $('closeImageViewerModal'),

  };
})();
