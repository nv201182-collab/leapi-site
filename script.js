(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => { root.dataset.motion = document.hidden || reduce.matches ? 'paused' : 'running'; };
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  sync();
})();
