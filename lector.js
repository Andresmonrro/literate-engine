(function () {
  const W = document.getElementById('reader-wrap');
  if (!W) return; // seguridadjj
  const ls = localStorage;

  function rSize(s, sv = true) {
    W.classList.remove('size-small', 'size-medium', 'size-large');
    W.classList.add('size-' + s);
    ['small', 'medium', 'large'].forEach(v => {
      const el = document.getElementById('r' + v[0]);
      if (el) el.classList.toggle('on', v === s);
    });
    if (sv) ls.setItem('r-size', s);
  }

  function rFont(f, sv = true) {
    W.classList.remove('font-nunito', 'font-times');
    if (f !== 'lora') W.classList.add('font-' + f);
    ['lora', 'nunito', 'times'].forEach(v => {
      const el = document.getElementById('rf-' + v);
      if (el) el.classList.toggle('on', v === f);
    });
    if (sv) ls.setItem('r-font', f);
  }

  function rTheme(t, sv = true) {
    W.classList.remove('dark-mode', 'sepia-mode');
    if (t === 'dark') W.classList.add('dark-mode');
    if (t === 'sepia') W.classList.add('sepia-mode');

    ['light', 'dark', 'sepia'].forEach(v => {
      const el = document.getElementById('rt-' + v);
      if (el) el.classList.toggle('on', v === t);
    });
    if (sv) ls.setItem('r-theme', t);
  }

  function rIndent(sv = true) {
    const on = W.classList.toggle('indent-on');
    const el = document.getElementById('rh');
    if (el) el.classList.toggle('on', on);
    if (sv) ls.setItem('r-indent', on ? '1' : '0');
  }

  rSize(ls.getItem('r-size') || 'medium', false);
  rFont(ls.getItem('r-font') || 'lora', false);
  rTheme(ls.getItem('r-theme') || 'dark', false);
  if (ls.getItem('r-indent') === '1') rIndent(false);

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const p = window.scrollY / totalHeight;
      const bar = document.getElementById('r-progress');
      if (bar) bar.style.width = (p * 100) + '%';
    }
  });

  window.rSize = rSize;
  window.rFont = rFont;
  window.rTheme = rTheme;
  window.rIndent = rIndent;

  // ---------------------------------------------------------------
  // CARGA DE CAPÍTULO POR PARÁMETRO
  // Uso: /p/lector.html?cap=cap-005
  // "cap-005" debe ser la ETIQUETA (label) única puesta a esa entrada.
  // ---------------------------------------------------------------
  const loadingEl = document.getElementById('chapter-loading');
  const errorEl = document.getElementById('chapter-error');
  const contentEl = document.getElementById('chapter-text');

  function showError(msg) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      if (msg) errorEl.textContent = msg;
    }
  }

  const cap = new URLSearchParams(location.search).get('cap');

  if (!cap) {
    showError('No se especificó ningún capítulo. Usa un enlace del índice.');
  } else {
    const feedUrl = location.origin + '/feeds/posts/default/-/' + encodeURIComponent(cap) + '?alt=json&max-results=1';

    fetch(feedUrl)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        const entry = data && data.feed && data.feed.entry && data.feed.entry[0];
        if (!entry) {
          showError('No se encontró ningún capítulo con esa etiqueta ("' + cap + '").');
          return;
        }
        const html = entry.content && entry.content.$t ? entry.content.$t : '';
        const title = entry.title && entry.title.$t ? entry.title.$t : 'Capítulo';

        contentEl.innerHTML = html;
        document.title = title;

        if (loadingEl) loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
      })
      .catch(err => {
        console.error(err);
        showError();
      });
  }
})();
