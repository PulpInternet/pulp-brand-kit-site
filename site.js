
(function () {
  var root = document.documentElement, base = document.body.getAttribute('data-root') || '';
  if (document.body.hasAttribute('data-404')) {   // 404.html is served at any depth: find the site root from the URL
    var parts = location.pathname.split('/'); base = location.hostname.endsWith('github.io') && parts.length > 2 ? '/' + parts[1] + '/' : '/';
    document.querySelectorAll('a[href]').forEach(function (a) { var h = a.getAttribute('href'); if (!/^(https?:|#|\/)/.test(h)) a.setAttribute('href', base + h.replace(/^(\.\.\/)+|^\.\//, '')); });
    document.querySelectorAll('link[href], script[src]').forEach(function (l) { var k = l.href ? 'href' : 'src'; var v = l.getAttribute(k); if (v && !/^(https?:|\/)/.test(v)) l.setAttribute(k, base + v.replace(/^(\.\.\/)+|^\.\//, '')); });
  }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* mode: follows the system, then remembers */
  function mode() { return root.getAttribute('data-mode') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function sync() { var m = mode(); document.querySelectorAll('[data-modes] input').forEach(function (i) { i.checked = i.value === m; }); }
  document.querySelectorAll('[data-modes] input').forEach(function (i) {
    i.addEventListener('change', function () { root.setAttribute('data-mode', i.value); try { localStorage.setItem('pulp:mode', i.value); } catch (e) {} sync(); });
  });
  sync();

  /* dialogs: one opener each, Escape and the backdrop close, focus returns */
  var opener = null;
  function open(d, from) { opener = from || document.activeElement; if (!d.open) d.showModal(); }
  function close(d) { if (d.open) d.close(); }
  document.querySelectorAll('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) close(d); });
    d.addEventListener('close', function () { if (opener && opener.focus) opener.focus(); if (d.id === 'viewer' && location.hash.indexOf('#view=') === 0) history.replaceState(null, '', location.pathname + location.search); });
    d.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { close(d); }); });
  });
  var menu = document.getElementById('menu'), menuBtn = document.querySelector('[data-open-menu]');
  menuBtn.addEventListener('click', function () { menuBtn.setAttribute('aria-expanded', 'true'); open(menu, menuBtn); });
  menu.addEventListener('close', function () { menuBtn.setAttribute('aria-expanded', 'false'); });

  /* the board viewer: opens from any board, keeps a shareable hash */
  var viewer = document.getElementById('viewer'), vimg = viewer.querySelector('img');
  function view(a) {
    vimg.src = a.getAttribute('data-src'); vimg.alt = a.getAttribute('data-title');
    viewer.querySelector('.k-viewer__title').textContent = a.getAttribute('data-title');
    viewer.querySelector('[data-full]').href = a.getAttribute('data-src');
    open(viewer, a);
    var id = a.closest('[id]'); if (id) history.replaceState(null, '', '#view=' + id.id);
  }
  document.querySelectorAll('[data-board]').forEach(function (a) { a.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); view(a); }); });
  if (location.hash.indexOf('#view=') === 0) { var el = document.getElementById(decodeURIComponent(location.hash.slice(6))); if (el && el.querySelector('[data-board]')) view(el.querySelector('[data-board]')); }

  /* copy buttons */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(b.getAttribute('data-copy')) : Promise.reject()).then(function () { b.textContent = 'Copied'; }, function () { b.textContent = 'Select and copy'; });
      setTimeout(function () { b.textContent = t; }, 1600);
    });
  });

  /* rule filters */
  var f = document.querySelector('[data-filters]');
  if (f) {
    var rules = [].slice.call(document.querySelectorAll('.k-rule')), count = f.querySelector('[data-count]');
    function apply() {
      var pick = function (n) { return [].slice.call(f.querySelectorAll('input[name=' + n + ']:checked')).map(function (i) { return i.value; }); };
      var c = pick('check'), s = pick('scope'), n = 0;
      rules.forEach(function (r) { var ok = (!c.length || c.indexOf(r.dataset.check) > -1) && (!s.length || s.indexOf(r.dataset.scope) > -1); r.hidden = !ok; if (ok) n++; });
      count.textContent = n + (n === 1 ? ' rule' : ' rules');
    }
    f.addEventListener('change', apply); f.addEventListener('reset', function () { setTimeout(apply, 0); });
  }

  /* contents: mark the part in view */
  var toc = document.querySelectorAll('.k-toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { toc.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); }); } }); }, { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('.k-prose > h2[id]').forEach(function (h) { io.observe(h); });
  }
  var tocd = document.querySelector('.k-toc details'); if (tocd && innerWidth < 1024) tocd.open = false;

  /* search: a static index, ranked, with the words marked */
  var idx = null, search = document.getElementById('search');
  function load(cb) { if (idx) return cb(); fetch(base + 'search.json').then(function (r) { return r.json(); }).then(function (j) { idx = j; cb(); }); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mark(s, ws) { var h = esc(s); ws.forEach(function (w) { h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); }); return h; }
  function run(q, list, out) {
    var ws = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!ws.length) { list.innerHTML = ''; out.textContent = ''; return; }
    var res = idx.map(function (e) {
      var t = e.t.toLowerCase(), s = e.s.toLowerCase(), sc = 0;
      for (var i = 0; i < ws.length; i++) { var w = ws[i], a = t.indexOf(w), b = s.indexOf(w); if (a < 0 && b < 0) return null; sc += (a === 0 ? 12 : a > 0 ? 8 : 0) + (b > -1 ? 2 : 0); }
      if (e.g === 'Pages') sc += 3; return { e: e, sc: sc };
    }).filter(Boolean).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 40);
    out.textContent = res.length ? res.length + (res.length === 40 ? '+' : '') + ' results' : 'Nothing found. Try a color, a rule ID or a board number.';
    function snip(s) { var at = s.toLowerCase().indexOf(ws[0]); if (at < 80) return s.slice(0, 180) + (s.length > 180 ? '…' : ''); return '…' + s.slice(at - 60, at + 120) + (s.length > at + 120 ? '…' : ''); }
    list.innerHTML = res.map(function (r, i) { return '<li><a href="' + base + r.e.p + '"' + (i === 0 ? ' aria-selected="true"' : '') + '><span class="k-label">' + r.e.g + '</span><span class="k-r__t">' + mark(r.e.t, ws) + '</span><span class="k-r__s">' + mark(snip(r.e.s), ws) + '</span></a></li>'; }).join('');
  }
  function wire(input, list, out) {
    var t; input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { load(function () { run(input.value, list, out); }); }, 60); });
    input.addEventListener('keydown', function (e) {
      var links = [].slice.call(list.querySelectorAll('a')), cur = links.findIndex(function (a) { return a.getAttribute('aria-selected') === 'true'; });
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!links.length) return; var n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length; links.forEach(function (a, i) { a.setAttribute('aria-selected', i === n ? 'true' : 'false'); }); links[n].scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Escape') { var dlg = input.closest('dialog'); if (dlg) { e.preventDefault(); close(dlg); } return; }
      if (e.key === 'Enter' && links.length) { e.preventDefault(); location.href = links[Math.max(cur, 0)].href; }
    });
  }
  wire(search.querySelector('input'), search.querySelector('.k-results'), search.querySelector('.k-search__count'));
  search.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); });
  document.querySelectorAll('[data-open-search]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(search, a); search.querySelector('input').focus(); }); });
  addEventListener('keydown', function (e) {
    var tag = (document.activeElement || {}).tagName;
    if ((e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') || (e.key === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); open(search); search.querySelector('input').focus(); }
  });
  var page = document.querySelector('[data-page-results]');
  if (page) {
    var pi = document.getElementById('q-page'), po = document.querySelector('.k-page .k-search__count');
    wire(pi, page, po);
    var q = new URLSearchParams(location.search).get('q'); if (q) { pi.value = q; load(function () { run(q, page, po); }); }
    pi.closest('form').addEventListener('submit', function (e) { e.preventDefault(); });
  }
})();
