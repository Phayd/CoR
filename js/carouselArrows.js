(() => {
  const App = window.App;

  App.bindCarouselArrows = function({
    shell,
    track,
    getIndex,
    getCount,
    setIndex
  }){
    const left = shell.querySelector('.carousel-arrow.left');
    const right = shell.querySelector('.carousel-arrow.right');

    if(!left || !right) return;

    function update(){
      const i = getIndex();
      const max = getCount() - 1;

      left.classList.toggle('disabled', i <= 0);
      right.classList.toggle('disabled', i >= max);
    }

    left.onclick = () => {
      if(left.classList.contains('disabled')) return;
      setIndex(getIndex() - 1);
    };

    right.onclick = () => {
      if(right.classList.contains('disabled')) return;
      setIndex(getIndex() + 1);
    };

    // expose for swipe handlers to call
    return { update };
  };
})();
