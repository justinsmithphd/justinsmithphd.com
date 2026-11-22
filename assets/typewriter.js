// Waits for the camo background to "land", fades the panel in, then types the intro.
// Segments: [text], [text, 'em'], [text, 'a', href].
(() => {
  const host = document.getElementById('type');
  if (!host) return;
  const SEG = [
    ['Hello\n\n'],
    ['My name is Justin Smith. My PhD is in Neuroscience. I am a leader in AI. I do '],
    ['lots', 'em'],
    [' of things and I have tenacious curiosity.\n\n'],
    ['Find my work: '],
    ['advancedanalyticsgroup.org', 'a', 'https://advancedanalyticsgroup.org/'],
    [' and '],
    ['tacticalneuro.com', 'a', 'https://tacticalneuro.com/'],
  ];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';

  host.textContent = '';
  const nodes = SEG.map(([text, tag, href]) => {
    const el = document.createElement(tag || 'span');
    if (href) { el.href = href; el.rel = 'noopener'; }
    host.appendChild(el);
    return { el, text };
  });
  host.appendChild(cursor);

  let started = false;
  function start() {
    if (started) return; started = true;
    host.classList.add('shown');
    if (reduce) { nodes.forEach(n => (n.el.textContent = n.text)); return; }
    let s = 0, i = 0;
    (function tick() {
      if (s >= nodes.length) return;
      const n = nodes[s], ch = n.text[i++];
      n.el.textContent += ch;
      if (i >= n.text.length) { s++; i = 0; }
      let d = 16 + Math.random() * 26;            // human-ish rhythm
      if (ch === '\n') d = 260; else if ('.,:'.includes(ch)) d = 140;
      setTimeout(tick, d);
    })();
  }

  addEventListener('camo:landed', () => setTimeout(start, 350));
  // fallbacks: no WebGL, background tab, or reduced motion
  setTimeout(start, reduce ? 0 : 7500);
  if (!window.WebGLRenderingContext) start();
})();
