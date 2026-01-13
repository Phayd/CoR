// js/imageViewer.js
(() => {
  const App = window.App;
  const d = App.dom;

  App.openImageViewer = function openImageViewer({ src, title, callIn }){
	  if(!src) return;

	  d.imageViewerImg.src = src;
	  d.imageViewerTitle.textContent = title || 'Card';

	  // Badge: show only if callIn is present
	  if(d.imageViewerCallInBadge){
		if(callIn){
		  d.imageViewerCallInBadge.style.display = 'block';
		  // store unit key for tap/hover preview framework
		  if(App.setCallInTarget) App.setCallInTarget(d.imageViewerCallInBadge, callIn);
		  if(App.bindCallInPreviewOnce) App.bindCallInPreviewOnce(d.imageViewerCallInBadge);
		} else {
		  d.imageViewerCallInBadge.style.display = 'none';
		  if(App.setCallInTarget) App.setCallInTarget(d.imageViewerCallInBadge, null);
		}
	  }

	  d.imageViewerModal.style.display = 'flex';
	};

	App.closeImageViewer = function closeImageViewer(){
	  d.imageViewerModal.style.display = 'none';
	  d.imageViewerImg.src = '';
	  d.imageViewerTitle.textContent = '';

	  if(d.imageViewerCallInBadge){
		d.imageViewerCallInBadge.style.display = 'none';
		if(App.setCallInTarget) App.setCallInTarget(d.imageViewerCallInBadge, null);
	  }
	};


  // close wiring once
  if(d.closeImageViewerModal && !d.closeImageViewerModal.dataset.bound){
    d.closeImageViewerModal.dataset.bound = '1';
    d.closeImageViewerModal.onclick = App.closeImageViewer;
  }
  if(d.imageViewerModal && !d.imageViewerModal.dataset.bound){
    d.imageViewerModal.dataset.bound = '1';
    d.imageViewerModal.onclick = (e) => { if(e.target === d.imageViewerModal) App.closeImageViewer(); };
  }
  if(d.imageViewerModalContent && !d.imageViewerModalContent.dataset.bound){
    d.imageViewerModalContent.dataset.bound = '1';
    d.imageViewerModalContent.onclick = (e) => e.stopPropagation();
  }
})();
