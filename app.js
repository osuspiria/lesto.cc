(() => {
  const D = window.LESTO;
  const UI = {
    pt: { about: 'sobre', contacts: 'contactos', contact: 'contacto', shuffle: 'baralhar', other: 'EN', dark: 'modo escuro', light: 'modo claro',
      with: 'com', what: 'o quê', where: 'onde', see: 'ver peça', close: 'fechar', footer: 'eletrónica, programação e sistemas para arte e cultura' },
    en: { about: 'about', contacts: 'contacts', contact: 'contact', shuffle: 'shuffle', other: 'PT', dark: 'dark mode', light: 'light mode',
      with: 'with', what: 'what', where: 'where', see: 'see the work', close: 'close', footer: 'electronics, programming and systems for art and culture' }
  };
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const tr = (v) => (v && typeof v === 'object' ? v[lang] ?? v.pt : v) || '';

  let lang = store.get('lesto-lang') || ((navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en');
  let theme = document.documentElement.dataset.theme || 'light';
  const canvas = $('#canvas'), modal = $('#modal');
  const W = { about: 340, contact: 300 };
  let pos = {}, z = 10, width = 0, drag = null;

  const ids = () => [...D.projetos.map((_, i) => 'p' + i), 'about'];
  const cardW = (id) => Math.min(W[id] || 250, Math.max(200, width - 48));

  const photosOf = (p) => [...(p.foto ? [p.foto] : []), ...(p.fotos || [])].filter(Boolean);
  // vídeos do YouTube: aceita youtu.be/ID, watch?v=ID, shorts/ID e embed/ID
  const ytId = (u) => (String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
  const videosOf = (p) => (p.videos || []).map(ytId).filter(Boolean);
  // aberto como ficheiro (file://) o YouTube recusa o leitor (erro 153, falta o Referer): mostra a miniatura com ligação
  const ytFrame = (id) => location.protocol === 'file:'
    ? `<a class="yt" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" title="YouTube"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="YouTube" loading="lazy"><span>▶</span></a>`
    : `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  const socials = () => {
    const c = D.contacto;
    return `<div class="socials">${c.instagram ? `<a href="https://instagram.com/${esc(c.instagram)}" target="_blank" rel="noopener">instagram @${esc(c.instagram)}</a>` : ''}${c.github ? `<a href="https://github.com/${esc(c.github)}" target="_blank" rel="noopener">github ${esc(c.github)}</a>` : ''}</div>`;
  };

  function cardHTML(id) {
    const t = UI[lang];
    if (id === 'about') {
      const s = D.sobre;
      return `<div class="pad"><h2>${t.about}</h2>${(s[lang] || s.pt).map((p) => `<p>${esc(p).replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>')}</p>`).join('')}${socials()}</div>`;
    }
    const p = D.projetos[+id.slice(1)];
    const ph = photosOf(p), vs = videosOf(p);
    const cover = ph[0] || (vs.length ? `https://i.ytimg.com/vi/${vs[0]}/hqdefault.jpg` : '');
    const count = [ph.length > 1 || (ph.length && vs.length) ? ph.length : '', vs.length ? `▶ ${vs.length}` : ''].filter(Boolean).join(' · ');
    return `<div class="pad">${cover ? `<div class="slides"><img class="on" src="${esc(cover)}" alt="${esc(p.titulo)}" draggable="false" loading="lazy">${count ? `<span class="count">${count}</span>` : ''}</div>` : `<div class="ph">${lang === 'pt' ? 'foto' : 'photo'} · ${esc(p.titulo)}</div>`}<div class="meta"><span>${esc(p.local)}</span><span>${esc(tr(p.data))}</span></div><h3>${esc(p.titulo)}</h3><p class="sm">${esc(tr(p.tipo))}<br><span class="muted">${esc(p.com)}</span></p></div>`;
  }

  function render() {
    const t = UI[lang];
    document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
    $('#k-about').textContent = t.about; $('#k-lang').textContent = t.other;
    $('#k-shuffle').title = t.shuffle; $('#k-shuffle').setAttribute('aria-label', t.shuffle);
    const tl = theme === 'dark' ? t.light : t.dark;
    $('#k-theme').title = tl; $('#k-theme').setAttribute('aria-label', tl);
    canvas.innerHTML = ids().map((id) => `<div class="card ${id[0] === 'p' ? 'project' : id}" data-id="${id}">${cardHTML(id)}</div>`).join('');
    canvas.querySelectorAll('.card').forEach((el) => { el.addEventListener('pointerdown', down); el.querySelectorAll('img').forEach((im) => im.addEventListener('load', fitHeight)); });
    if (Object.keys(pos).length) place(); else scatter();
  }

  function place() {
    canvas.querySelectorAll('.card').forEach((el) => {
      const id = el.dataset.id, p = pos[id]; if (!p) return;
      el.style.width = cardW(id) + 'px';
      el.style.transform = `translate(${Math.round(p.x)}px,${Math.round(p.y)}px) rotate(${drag && drag.id === id && (drag.moved || drag.armed) ? 0 : p.r}deg)`;
      el.style.zIndex = p.z;
    });
    fitHeight();
  }
  function fitHeight() {
    let max = 0;
    canvas.querySelectorAll('.card').forEach((el) => { const p = pos[el.dataset.id]; if (p) max = Math.max(max, p.y + el.offsetHeight); });
    canvas.style.height = Math.max(max + 80, window.innerHeight * 0.7) + 'px';
  }

  function scatter() {
    width = canvas.offsetWidth || window.innerWidth;
    const narrow = width < 640;
    const cols = Math.max(1, Math.floor((width - 32) / 310));
    const cellW = (width - 32) / cols;
    const els = {}; canvas.querySelectorAll('.card').forEach((el) => { els[el.dataset.id] = el; el.style.width = cardW(el.dataset.id) + 'px'; });
    const order = ids().sort(() => Math.random() - 0.5);
    if (narrow) { order.splice(order.indexOf('about'), 1); order.unshift('about'); }
    let rowTop = 32;
    for (let i = 0; i < order.length; i += cols) {
      const row = order.slice(i, i + cols);
      let rowH = 0;
      row.forEach((id, col) => {
        const w = cardW(id), slack = Math.max(0, cellW - w);
        const y = rowTop + Math.random() * (narrow ? 16 : 60);
        pos[id] = { x: Math.max(16, Math.min(width - w - 16, 16 + col * cellW + Math.random() * slack)), y, r: +((Math.random() - 0.5) * (narrow ? 5 : 7)).toFixed(2), z: ++z };
        rowH = Math.max(rowH, y - rowTop + (els[id] ? els[id].offsetHeight : 300));
      });
      rowTop += rowH + (narrow ? 28 : 48);
    }
    place();
  }
  function clampAll() {
    width = canvas.offsetWidth;
    Object.keys(pos).forEach((id) => { pos[id].x = Math.max(16, Math.min(width - cardW(id) - 16, pos[id].x)); });
    place();
  }

  function bringUp(id) {
    const hd = $('.top').offsetHeight, top = Math.max(0, hd - canvas.getBoundingClientRect().top) + 24;
    const w = cardW(id);
    pos[id] = { ...pos[id], x: Math.max(16, (width - w) / 2 + (Math.random() - 0.5) * 80), y: top, r: +((Math.random() - 0.5) * 4).toFixed(2), z: ++z };
    place();
  }

  // arrastar: rato = imediato; toque = pressão longa (320 ms), toque curto abre / scroll normal
  function down(e) {
    if (e.button) return;
    if (e.target.closest('a')) return;
    const el = e.currentTarget, id = el.dataset.id, p = pos[id];
    const touch = e.pointerType === 'touch';
    const d = drag = { id, el, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: false, touch, armed: false };
    if (touch) {
      d.timer = setTimeout(() => {
        if (drag !== d) return;
        d.armed = true; p.z = ++z; el.classList.add('lifted');
        navigator.vibrate && navigator.vibrate(12); place();
      }, 320);
      return;
    }
    e.preventDefault(); p.z = ++z; place();
  }
  window.addEventListener('pointermove', (e) => {
    const d = drag; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (d.touch && !d.armed) { if (Math.abs(dx) + Math.abs(dy) > 8) { clearTimeout(d.timer); drag = null; } return; }
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 4) { d.moved = true; d.el.classList.add('lifted'); }
    if (!d.moved) return;
    const p = pos[d.id]; p.x = d.ox + dx; p.y = Math.max(0, d.oy + dy); place();
  });
  const end = (cancel) => () => {
    const d = drag; drag = null; if (!d) return;
    clearTimeout(d.timer); d.el.classList.remove('lifted');
    if (!cancel && !d.moved && !d.armed) { if (d.id[0] === 'p') open(+d.id.slice(1)); else if (d.id === 'about') openAbout(); }
    place();
  };
  window.addEventListener('pointerup', end(false));
  window.addEventListener('pointercancel', end(true));
  window.addEventListener('touchmove', (e) => { if (drag && drag.armed) e.preventDefault(); }, { passive: false });

  // janela do projeto
  function open(i) {
    const p = D.projetos[i], t = UI[lang];
    const ph = photosOf(p), vs = videosOf(p);
    const texto = tr(p.texto);
    const lead = ph.length ? `<img src="${esc(ph[0])}" alt="${esc(p.titulo)}">` : vs.length ? ytFrame(vs[0]) : `<div class="ph ph-wide">${lang === 'pt' ? 'foto' : 'photo'} · ${esc(p.titulo)}</div>`;
    const rest = [...(ph.length ? vs : vs.slice(1)).map(ytFrame), ...ph.slice(1).map((f) => `<img src="${esc(f)}" alt="" loading="lazy">`)];
    modal.innerHTML = `<article role="dialog" aria-modal="true" aria-label="${esc(p.titulo)}">
      <div class="row"><span>${esc([p.local, tr(p.data)].filter(Boolean).join(' · '))}</span><button class="close" data-close>${t.close} ✕</button></div>
      <h2>${esc(p.titulo)}</h2>
      <p class="facts">${[esc(tr(p.tipo)), [esc(p.com), p.link ? `<a class="see" href="${esc(p.link)}" target="_blank" rel="noopener">${t.see} ↗</a>` : ''].filter(Boolean).join(' ')].filter(Boolean).join('<br>')}</p>
      ${lead}
      ${texto ? texto.split(/\n\s*\n/).map((x) => `<p>${esc(x)}</p>`).join('') : ''}
      ${rest.length ? `<div class="gallery">${rest.join('')}</div>` : ''}
    </article>`;
    modal.hidden = false; document.body.classList.add('locked');
    modal.querySelector('[data-close]').focus();
  }
  function openAbout() {
    const s = D.sobre, t = UI[lang];
    modal.innerHTML = `<article role="dialog" aria-modal="true" aria-label="${t.about}">
      <div class="row"><span></span><button class="close" data-close>${t.close} ✕</button></div>
      <h2>${t.about}</h2>
      ${(s[lang] || s.pt).map((p) => `<p>${esc(p).replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>')}</p>`).join('')}
      ${socials()}
    </article>`;
    modal.hidden = false; document.body.classList.add('locked');
    modal.querySelector('[data-close]').focus();
  }
  function close() { modal.hidden = true; modal.innerHTML = ''; document.body.classList.remove('locked'); }
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-close]')) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  // teclas
  $('#k-about').onclick = openAbout;
  $('#k-shuffle').onclick = scatter;
  $('#k-lang').onclick = () => { lang = lang === 'pt' ? 'en' : 'pt'; store.set('lesto-lang', lang); render(); };
  $('#k-theme').onclick = () => {
    theme = theme === 'dark' ? 'light' : 'dark'; store.set('lesto-theme', theme);
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name=theme-color]').content = theme === 'dark' ? '#171615' : '#f3f2f2';
    render();
  };

  new ResizeObserver(() => {
    const w = canvas.offsetWidth; if (!w || w === width) return;
    if (Math.abs(w - width) > 120) scatter(); else clampAll();
  }).observe(canvas);

  render();
  if (document.fonts) document.fonts.ready.then(fitHeight);

  // relógio binário (BCD) no cabeçalho: HH MM SS, bit mais alto em cima
  const bc = $('#bclock'), k1 = $('#knob1'), sled = $('#scope-led');
  const BITS = [2, 4, 3, 4, 3, 4];
  bc.innerHTML = BITS.map((n, c) => `<div class="bcol${c % 2 ? ' gap' : ''}">${Array.from({ length: 4 }, (_, r) => 3 - r < n ? `<i data-c="${c}" data-b="${3 - r}"></i>` : '<b></b>').join('')}</div>`).join('');
  const dots = [...bc.querySelectorAll('i')];
  let lastSec = -1;
  function clockFrame(now) {
    const d = new Date(), s = d.getSeconds();
    if (s !== lastSec) {
      lastSec = s;
      const p = [d.getHours(), d.getMinutes(), s].map((v) => String(v).padStart(2, '0')).join('');
      dots.forEach((el) => { el.classList.toggle('on', (+p[+el.dataset.c] >> +el.dataset.b) & 1); });
      bc.parentElement.parentElement.title = p.replace(/(..)(..)(..)/, '$1:$2:$3');
      sled.style.opacity = s % 2 ? 1 : .35;
    }
    k1.style.transform = `rotate(${Math.sin(now / 2500) * 120}deg)`;
    requestAnimationFrame(clockFrame);
  }
  requestAnimationFrame(clockFrame);

  // bicho (circuito integrado) + multímetro voador com teias
  const mk = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };

  const svg = svgEl('svg', { class: 'webs' }); document.body.appendChild(svg);
  const webs = [], splats = [];
  [0, 1].map((i) => {
    const g = svgEl('g', {}, svg), col = i ? 'var(--pink)' : 'var(--fg)';
    webs.push(svgEl('path', { fill: 'none', 'stroke-width': 1.6, 'stroke-linecap': 'round', style: `stroke:${col}` }, g));
    webs.push(svgEl('path', { fill: 'none', 'stroke-width': 0.7, 'stroke-opacity': 0.55, 'stroke-dasharray': '6 3', style: `stroke:${col}` }, g));
    const s = svgEl('g', { style: 'opacity:0' }, g);
    svgEl('path', { d: 'M-5 0L5 0M0 -5L0 5M-3.5 -3.5L3.5 3.5M-3.5 3.5L3.5 -3.5', 'stroke-width': 1, 'stroke-linecap': 'round', style: 'stroke:var(--fg)' }, s);
    svgEl('circle', { r: 2, style: `fill:${col}` }, s);
    splats.push(s);
  });

  const meter = mk('div', 'critter', document.body); meter.style.zIndex = 50;
  const body = mk('div', 'meter-body', meter);
  const lcd = mk('div', 'meter-lcd', body); lcd.textContent = '- - -';
  mk('div', 'meter-dial', body);
  const jk = mk('div', 'meter-jacks', body); mk('i', '', jk); mk('i', '', jk);
  const wings = [0, 1].map((i) => { const w = mk('div', 'wing', meter); w.style.left = i ? '6px' : '-28px'; w.style.transformOrigin = i ? '0% 100%' : '100% 100%'; return w; });

  const chip = mk('div', 'critter', document.body); chip.style.zIndex = 51;
  const hit = mk('div', 'chip-hit', chip); hit.title = 'lesto-555';
  const legs = [];
  for (let i = 0; i < 8; i++) {
    const l = mk('div', 'chip-pin', hit), top = i < 4;
    l.style.left = 13 + (i % 4) * 12 + 'px'; l.style.top = (top ? 1 : 34) + 'px'; l.style.transformOrigin = top ? '50% 100%' : '50% 0%';
    legs.push(l);
  }
  const cb = mk('div', 'chip-body', hit); cb.append('LST555'); mk('div', 'chip-notch', cb); mk('div', 'chip-led', cb);

  const vw = () => window.innerWidth, vh = () => window.innerHeight;
  const s = { x: vw() * 0.7, y: vh() * 0.75, a: Math.PI, tx: 0, ty: 0, pause: 0, ph: 0, boost: 0 };
  const m = { x: s.x + 120, y: s.y - 40, vx: 0, vy: 0, tilt: 0, t: 0 };
  const pr = { mode: 'idle', t: 0, timer: 2, pins: [1, 6], read: '- - -' };
  const READS = ['4.98 V', '3.31 V', '12.0 V', '0.00 Ω', '1.21 kΩ', '220 Ω', '0.72 V', 'OL'];
  const pick = () => { s.tx = 40 + Math.random() * (vw() - 80); s.ty = 100 + Math.random() * (vh() - 150); };
  pick();
  hit.addEventListener('click', () => { s.pause = 0; s.boost = 1.4; pick(); });
  const pinPos = (i) => {
    const lx = -22.5 + (i % 4) * 12, ly = i < 4 ? -19 : 20, c = Math.cos(s.a), sn = Math.sin(s.a);
    return [s.x + lx * c - ly * sn, s.y + lx * sn + ly * c];
  };
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const curve = (j, tip, sag) => `M${j[0].toFixed(1)} ${j[1].toFixed(1)} Q${((j[0] + tip[0]) / 2).toFixed(1)} ${((j[1] + tip[1]) / 2 + sag).toFixed(1)} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}`;

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let moving = false;
    if (s.pause > 0) s.pause -= dt;
    else {
      const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
      if (d < 8) { if (Math.random() < 0.55) s.pause = 0.8 + Math.random() * 2.5; pick(); }
      else {
        let da = Math.atan2(dy, dx) - s.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        s.a += da * Math.min(1, dt * (s.boost > 0 ? 9 : 3.5));
        const sp = 48 * (s.boost > 0 ? 4 : 1) * (Math.abs(da) > 1.2 ? 0.35 : 1);
        s.x += Math.cos(s.a) * sp * dt; s.y += Math.sin(s.a) * sp * dt; s.ph += dt * (8 + sp * 0.12); moving = true;
      }
    }
    if (s.boost > 0) s.boost -= dt;
    chip.style.transform = `translate(${s.x}px,${s.y}px) rotate(${s.a}rad)`;
    legs.forEach((l, i) => {
      const p = s.ph + (((i % 4) + (i < 4 ? 0 : 1)) % 2 ? Math.PI : 0);
      l.style.transform = `translateX(${moving ? Math.sin(p) * 3.2 : 0}px) scaleY(${1 - (moving ? Math.max(0, Math.cos(p)) * 0.4 : 0)})`;
    });
    const gx = s.x - Math.cos(s.a) * 100, gy = s.y - Math.sin(s.a) * 100 - 45;
    m.vx += ((gx - m.x) * 3 - m.vx * 2.6) * dt; m.vy += ((gy - m.y) * 3 - m.vy * 2.6) * dt;
    m.x += m.vx * dt; m.y += m.vy * dt; m.t += dt;
    m.tilt += (Math.max(-14, Math.min(14, m.vx * 0.12)) - m.tilt) * Math.min(1, dt * 4);
    const bob = Math.sin(m.t * 2.4) * 4;
    meter.style.transform = `translate3d(${m.x.toFixed(2)}px,${(m.y + bob).toFixed(2)}px,0) rotate(${m.tilt.toFixed(2)}deg)`;
    const flap = Math.sin(m.t * 30);
    wings.forEach((w, i) => { w.style.transform = `rotate(${((i ? 1 : -1) * (12 + flap * 22)).toFixed(1)}deg)`; });
    const dist = Math.hypot(s.x - m.x, s.y - m.y);
    if (pr.mode === 'idle') { pr.timer -= dt; if (pr.timer <= 0 && dist < 230) { pr.mode = 'shoot'; pr.t = 0; pr.pins = [Math.floor(Math.random() * 4), 4 + Math.floor(Math.random() * 4)]; } }
    else if (pr.mode === 'shoot') { pr.t += dt / 0.2; if (pr.t >= 1) { pr.t = 1; pr.mode = 'attached'; pr.timer = 1.4 + Math.random() * 2; pr.read = READS[Math.floor(Math.random() * READS.length)]; } }
    else if (pr.mode === 'attached') { pr.timer -= dt; if (pr.timer <= 0 || dist > 270 || s.boost > 0) { pr.mode = 'retract'; pr.read = '- - -'; } }
    else if (pr.mode === 'retract') { pr.t -= dt / 0.28; if (pr.t <= 0) { pr.t = 0; pr.mode = 'idle'; pr.timer = 1 + Math.random() * 2.5; } }
    if (lcd.textContent !== pr.read) lcd.textContent = pr.read;
    const jr = m.tilt * Math.PI / 180, jc = Math.cos(jr), js = Math.sin(jr);
    [-7, 7].forEach((dx, i) => {
      const j = [m.x + dx * jc - 20 * js, m.y + bob + dx * js + 20 * jc];
      const hang = [j[0] + (i ? 3 : -3), j[1] + 14], pin = pinPos(pr.pins[i]), e = ease(pr.t);
      const tip = [hang[0] + (pin[0] - hang[0]) * e, hang[1] + (pin[1] - hang[1]) * e];
      const sag = Math.min(30, Math.hypot(tip[0] - j[0], tip[1] - j[1]) * 0.12) * (pr.mode === 'shoot' ? 0.2 : 1);
      webs[i * 2].setAttribute('d', curve(j, tip, sag));
      webs[i * 2 + 1].setAttribute('d', curve([j[0] + 1.5, j[1]], [tip[0] + 1.5, tip[1] - 1], sag * 1.5 + 3));
      splats[i].setAttribute('transform', `translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)})`);
      splats[i].style.opacity = pr.t > 0.95 ? 1 : 0;
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
