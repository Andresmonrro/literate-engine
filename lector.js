(function () {
  const W = document.getElementById('reader-wrap');
  if (!W) return; 
  const ls = localStorage;


  if (!document.getElementById('r-toolbar')) {
    const toolbarHTML = `
      <div id="r-progress"></div>
      <div id="r-toolbar">
        <div class="tg">
          <span class="tl">Texto</span>
          <button class="tb" id="rs" onclick="rSize('small')">A</button>
          <button class="tb on" id="rm" onclick="rSize('medium')" style="font-size:15px;">A</button>
          <button class="tb" id="rl" onclick="rSize('large')" style="font-size:17px;">A</button>
        </div>
        <div class="tg">
          <span class="tl">Fuente</span>
          <button class="tb on" id="rf-lora" onclick="rFont('lora')" style="font-family:Georgia,serif;">Lora</button>
          <button class="tb" id="rf-nunito" onclick="rFont('nunito')" style="font-family:'Trebuchet MS',sans-serif;">Nunito</button>
          <button class="tb" id="rf-times" onclick="rFont('times')" style="font-family:'Times New Roman',serif;">Times</button>
        </div>
        <div class="tg">
          <span class="tl">Tema</span>
          <button class="tb" id="rt-light" onclick="rTheme('light')">Claro</button>
          <button class="tb on" id="rt-dark" onclick="rTheme('dark')">Oscuro</button>
          <button class="tb" id="rt-sepia" onclick="rTheme('sepia')">Sepia</button>
        </div>
        <div class="tg">
          <span class="tl">Sangria</span>
          <button class="tb" id="rh" onclick="rIndent()">1.25 cm</button>
        </div>
      </div>
      <div id="chapter-loading" style="display:none;">Cargando capítulo…</div>
      <div id="chapter-error" style="display:none;">No se pudo cargar este capítulo. Verifica el enlace o vuelve al índice.</div>
    `;
    W.insertAdjacentHTML('afterbegin', toolbarHTML);
  }

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
  // MODO A — EMBEBIDO EN LA ENTRADA (recomendado, mejor SEO):
  //   El capítulo ya está escrito directamente dentro de #chapter-text
  //   en el HTML de la entrada. No hay ?cap en la URL. No se hace fetch,
  //   solo se muestra el contenido tal cual.
  //
  // MODO B — PÁGINA LECTORA ÚNICA (opcional):
  //   La URL trae ?cap=ETIQUETA. Se busca esa entrada por su etiqueta
  //   vía el feed JSON de Blogger y se inyecta el contenido.
  // ---------------------------------------------------------------
  const loadingEl = document.getElementById('chapter-loading');
  const errorEl = document.getElementById('chapter-error');
  const contentEl = document.getElementById('chapter-text');
  const cap = new URLSearchParams(location.search).get('cap');

  function showError(msg) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      if (msg) errorEl.textContent = msg;
    }
  }

  if (!cap) {
    // Modo embebido: el contenido ya está en el HTML, no se toca nada.
    if (contentEl) contentEl.style.display = 'block';
  } else {
    // Modo página lectora: se busca el capítulo por etiqueta.
    if (loadingEl) loadingEl.style.display = 'block';
    if (contentEl) contentEl.style.display = 'none';

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

  // ---------------------------------------------------------------
  // NAVEGACIÓN AUTOMÁTICA ANTERIOR/SIGUIENTE POR ETIQUETA
  // En la entrada, en vez de escribir los enlaces a mano, pon:
  //   <div data-chapter-nav="novela-titulo"></div>
  // Todos los capítulos de esa novela deben compartir la misma etiqueta.
  // El script ubica la entrada actual dentro de esa etiqueta (ordenada
  // cronológicamente) y arma los enlaces Anterior/Siguiente solo.
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // NAVEGACIÓN AUTOMÁTICA ANTERIOR/SIGUIENTE POR ETIQUETA NUMERADA
  // En la entrada, pon:
  //   <div data-chapter-nav="novela-titulo"></div>
  // Y ponle a la entrada DOS etiquetas:
  //   - "novela-titulo"  (compartida por todos los capítulos de la novela)
  //   - "cap-006"        (única por capítulo, con el número de orden)
  // El orden lo define el número de "cap-N", NO la fecha de publicación,
  // así que puedes editar o reprogramar capítulos sin romper la navegación.
  // ---------------------------------------------------------------
  const navEls = document.querySelectorAll('[data-chapter-nav]');
  if (navEls.length) {
    const seriesLabel = navEls[0].getAttribute('data-chapter-nav');
    const feedUrl = location.origin + '/feeds/posts/summary/-/' + encodeURIComponent(seriesLabel) + '?alt=json&max-results=500';

    fetch(feedUrl)
      .then(r => r.json())
      .then(data => {
        const entries = (data.feed && data.feed.entry) || [];
        const canonicalTag = document.querySelector('link[rel="canonical"]');
        const currentUrl = (canonicalTag ? canonicalTag.href : location.href).split('?')[0].split('#')[0];

        // Mapa número de capítulo -> url, + detecta el número del capítulo actual
        const byNumber = {};
        let currentN = null;

        entries.forEach(e => {
          const alt = (e.link || []).find(l => l.rel === 'alternate');
          const url = alt ? alt.href.split('?')[0] : null;
          if (!url) return;

          const cats = e.category || [];
          const capCat = cats.find(c => /^cap-\d+$/.test(c.term));
          if (!capCat) return; // esta entrada no tiene etiqueta numerada, se ignora

          const n = parseInt(capCat.term.replace('cap-', ''), 10);
          byNumber[n] = url;

          if (currentUrl.indexOf(url) !== -1) currentN = n;
        });

        const prevUrl = currentN !== null ? byNumber[currentN - 1] : null;
        const nextUrl = currentN !== null ? byNumber[currentN + 1] : null;

        navEls.forEach(el => {
          el.innerHTML = `
            <hr class="nav-divider">
            <div class="chapter-nav-container">
              <div class="nav-subtitle">Fin</div>
              <div class="nav-links-row">
                ${prevUrl ? `<a href="${prevUrl}" class="chapter-btn">«Anterior</a>` : `<span class="chapter-btn" style="opacity:.3;">«Anterior</span>`}
                <span class="nav-slashes">|</span>
                ${nextUrl ? `<a href="${nextUrl}" class="chapter-btn">Siguiente»</a>` : `<span class="chapter-btn" style="opacity:.3;">Siguiente»</span>`}
              </div>
            </div>`;
        });
      })
      .catch(err => console.error('Error cargando navegación automática:', err));
  }
})();
