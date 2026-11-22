// Types the intro character by character. Segments: plain text, {em}, {a: href}.
(() => {
  const host = document.getElementById('type');
  if (!host) return;
  const email = host.dataset.email;
  const SEG = [
    ['Hello⠀( • ‿ • )\n\n'],
    ['My name is Justin Smith. My PhD is in Neuroscience.\n'],
    ['I am a leader in AI, and help companies get real value out of their data. I do '],
    ['lots', 'em'],
    [' of things and I have tenacious curiosity.\n\n'],
    ['Read what I’m thinking and building in my '],
    ['public notepad', 'a', '/notepad/'],
    [', or say hi at '],
    [email, 'a', 'mailto:' + email],
    ['.'],
  ];

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  host.textContent = '';
  const nodes = SEG.map(([text, tag, href]) => {
    const el = tag ? document.createElement(tag) : document.createElement('span');
    if (href) el.href = href;
    host.appendChild(el);
    return { el, text };
  });
  host.appendChild(cursor);

  if (reduce) { nodes.forEach(n => (n.el.textContent = n.text)); return; }

  let s = 0, i = 0;
  function tick() {
    if (s >= nodes.length) return;
    const n = nodes[s];
    const ch = n.text[i++];
    n.el.textContent += ch;
    if (i >= n.text.length) { s++; i = 0; }
    // human-ish rhythm: pause on punctuation and line breaks
    let d = 16 + Math.random() * 26;
    if (ch === '\n') d = 260; else if ('.,)'.includes(ch)) d = 140;
    setTimeout(tick, d);
  }
  setTimeout(tick, 450);
})();
