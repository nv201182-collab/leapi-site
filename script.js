(() => {
  'use strict';
  const root = document.documentElement;
  const card = document.querySelector('.app-preview');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
    card.style.removeProperty('--mx');
    card.style.removeProperty('--my');
  }
  function sync() {
    const stopped = document.hidden || reduce.matches;
    root.dataset.motion = stopped ? 'paused' : 'running';
    if (stopped) reset();
  }
  card.addEventListener('pointermove', event => {
    if (!fine.matches || reduce.matches || document.hidden) return;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
      card.style.setProperty('--rx', ((.5 - y) * 2).toFixed(2) + 'deg');
      card.style.setProperty('--ry', ((x - .5) * 3).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
  }, {passive:true});
  card.addEventListener('pointerleave', reset);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  fine.addEventListener('change', reset);
  sync();
})();
