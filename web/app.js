// Particle background
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
let particles = [];
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();
for (let i = 0; i < 110; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    dx: (Math.random() - 0.5) * 0.25,
    dy: (Math.random() - 0.5) * 0.25,
    c: `hsl(${Math.random()*360},70%,55%)`
  });
}
function drawParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p => {
    p.x += p.dx; p.y += p.dy;
    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = p.c;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  requestAnimationFrame(drawParticles);
}
requestAnimationFrame(drawParticles);

// Navigation toggle for mobile
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Nav link active state & smooth scroll
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    if (link.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      navMenu.classList.remove('active'); // close mobile menu
      
      const target = link.getAttribute('href');
      if (target === '#home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (target === '#trending') {
        document.getElementById('trendingSection')?.scrollIntoView({ behavior: 'smooth' });
      } else if (target === '#sources') {
        document.getElementById('newsList')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// Terminal Modal
const terminalModal = document.getElementById('terminalModal');
const terminalContent = document.getElementById('terminalContent');
const terminalClose = document.querySelector('.terminal-close');

function openTerminal(article) {
  const html = `
    <h1>${article.title}</h1>
    <div class="meta-info">
      <span>Source: ${article.source}</span> | 
      <span>Published: ${formatTime(article.published)}</span>
    </div>
    <p>${article.summary || 'No summary available.'}</p>
    <div class="term-actions">
      <button id="summaryBtn" class="mini-btn" data-id="${article.id}">Generate Summary</button>
      <a class="mini-btn" href="${article.link}" target="_blank" rel="noopener noreferrer">Open Source ↗</a>
    </div>
  `;
  terminalContent.innerHTML = '';
  terminalModal.classList.add('active');
  
  // Typing effect
  let i = 0;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText;
  
  function typeWriter() {
    if (i < Math.min(text.length, 500)) {
      terminalContent.innerHTML = html.substring(0, i + 1);
      i += 3;
      setTimeout(typeWriter, 10);
    } else {
      terminalContent.innerHTML = html;
    }
  }
  typeWriter();
  setTimeout(()=>{
    const btn = document.getElementById('summaryBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.textContent = 'Summarizing...'; btn.disabled = true;
        fetch('/api/summary?id=' + btn.getAttribute('data-id'))
          .then(r=>r.json())
          .then(d=>{
            if (d.summary) {
              const block = document.createElement('div');
              block.style.marginTop='1rem';
              block.innerHTML = `<p><strong>Summary:</strong> ${d.summary}</p>`;
              terminalContent.appendChild(block);
            }
          }).finally(()=>{ btn.textContent='Summary Ready'; });
      });
    }
  }, 550);
}

function closeTerminal() {
  terminalModal.classList.remove('active');
  terminalContent.innerHTML = '';
}

terminalClose.addEventListener('click', closeTerminal);
terminalModal.addEventListener('click', (e) => {
  if (e.target === terminalModal) closeTerminal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTerminal();
});

// WebSocket + UI logic & new feature references
const listEl = document.getElementById('newsList');
const statusEl = document.getElementById('status');
const searchEl = document.getElementById('search');
const trendingSectionEl = document.getElementById('trendingSection');
const sourceChipsEl = document.getElementById('sourceChips');
const newBanner = document.getElementById('newBanner');
const newCountEl = document.getElementById('newCount');
const skeletonEl = document.getElementById('skeleton');
const groupToggle = document.getElementById('groupToggle');
const bookmarkToggle = document.getElementById('bookmarkViewToggle');
const themeToggle = document.getElementById('themeToggle');
const sourceStatsEl = document.getElementById('sourceStats');
const categoryStatsEl = document.getElementById('categoryStats');
const heatmapEl = document.getElementById('heatmap');
const heatmapModeBtn = document.getElementById('heatmapModeBtn');
const heatmapExpandBtn = document.getElementById('heatmapExpandBtn');
const heatLegend = document.getElementById('heatLegend');
const heatTooltip = document.getElementById('heatTooltip');
const scrollProgress = document.getElementById('scrollProgress');

let allItems = [];
let unseenQueue = [];
let meta = { trending: [], categories: [], sourceStats: {}, hours: [] };
let activeSource = '';
let grouped = false;
let bookmarkView = false;
let bookmarks = new Set(JSON.parse(localStorage.getItem('bookmarks') || '[]'));
let currentTheme = localStorage.getItem('theme') || 'default';
let heatmapMode = 'log'; // 'log' or 'category'
let heatmapExpanded = false;

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString('en-US', { hour12: false });
}

// Extract keywords and compute trending topics
function getTrendingTopics(items) {
  const stopWords = new Set(['the','a','an','and','or','but','is','in','on','at','to','for','of','with','by','from','as','this','that','it','are','was','be','been','has','have','will','can','news','crypto','cryptocurrency','bitcoin','btc','eth','ethereum']);
  const wordCount = {};
  items.forEach(item => {
    const words = (item.title + ' ' + item.summary).toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    words.forEach(w => {
      if (!stopWords.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    });
  });
  const sorted = Object.entries(wordCount).sort((a,b) => b[1] - a[1]).slice(0, 10);
  return sorted.map(([word, count]) => ({ word, count }));
}

function renderTrending() {
  const trending = getTrendingTopics(allItems);
  if (trending.length === 0) {
    trendingSectionEl.innerHTML = '';
    return;
  }
  const html = `<h3>🔥 Trending Topics</h3><div class="trending-tags">${trending.map(t => 
    `<span class="trending-tag" data-keyword="${t.word}">${t.word}<span class="count">(${t.count})</span></span>`
  ).join('')}</div>`;
  trendingSectionEl.innerHTML = html;
  document.querySelectorAll('.trending-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      searchEl.value = tag.getAttribute('data-keyword');
      render();
    });
  });
}

function applyTheme() {
  if (currentTheme === 'matrix') {
    document.documentElement.style.setProperty('--accent','#00ff41');
    document.documentElement.style.setProperty('--accent2','#00b386');
    document.body.classList.add('theme-matrix');
  } else if (currentTheme === 'magenta') {
    document.documentElement.style.setProperty('--accent','#ff6bf2');
    document.documentElement.style.setProperty('--accent2','#8f6bff');
  } else { // default
    document.documentElement.style.setProperty('--accent','#0fffc1');
    document.documentElement.style.setProperty('--accent2','#ff00ff');
  }
}

function buildSourceChips() {
  const sources = Array.from(new Set(allItems.map(i=>i.source))).sort();
  sourceChipsEl.innerHTML = `<span class="source-chip ${activeSource===''?'active':''}" data-src="">All</span>` + sources.map(s=>`<span class="source-chip ${s===activeSource?'active':''}" data-src="${s}">${s}</span>`).join('');
  sourceChipsEl.querySelectorAll('.source-chip').forEach(ch => {
    ch.addEventListener('click', () => {
      activeSource = ch.getAttribute('data-src');
      buildSourceChips();
      render();
    });
  });
}

function sentimentClass(s) { return s ? `sentiment-${s}` : ''; }

function decorateArticleHTML(item) {
  const bookmarked = bookmarks.has(item.id);
  return `<li class="news-item ${sentimentClass(item.sentiment)}" data-id="${item.id}" data-url="${item.link}">
    <div class="meta">
      <span>${item.source}</span>
      <span>• ${formatTime(item.published)}</span>
      <span>${item.sentiment||''}</span>
    </div>
    <h2>${item.title}</h2>
    <div class="summary">${(item.summary || '').slice(0,220)}${item.summary && item.summary.length>220 ? '…' : ''}</div>
    <div class="actions">
      <button class="bookmark-btn ${bookmarked?'active':''}" title="Bookmark">★</button>
      <button class="read-terminal" data-article='${JSON.stringify(item).replace(/'/g, "&#39;")}' >⚡ Read</button>
      <a href="${item.link}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">Open</a>
    </div>
  </li>`;
}

function renderHeatmap() {
  if (!meta.hours || !meta.hours.length) { heatmapEl.innerHTML=''; heatLegend.innerHTML=''; return; }
  const max = Math.max(...meta.hours, 1);
  if (heatmapMode === 'log') {
    heatmapEl.innerHTML = meta.hours.map((v,i)=>{
      const intensity = (Math.log(v+1)/Math.log(max+1)).toFixed(2);
      return `<div class=\"heat-cell\" data-intensity data-hour=\"${i}\" data-value=\"${v}\" style=\"--intensity:${intensity}\"></div>`;
    }).join('');
    heatLegend.innerHTML = '<span><div class="swatch" style="background:#1c2533"></div>0</span><span><div class="swatch" style="background:#114a4a"></div>low</span><span><div class="swatch" style="background:#0b7a7a"></div>mid</span><span><div class="swatch" style="background:#05b5b5"></div>high</span><span><div class="swatch" style="background:#03e2e2"></div>peak</span>';
  } else { // category thresholds
    heatmapEl.innerHTML = meta.hours.map((v,i)=>{
      let cls = 'cat-none';
      if (v>0 && v<=2) cls='cat-low'; else if (v<=5) cls='cat-med'; else if (v<=10) cls='cat-high'; else if (v>10) cls='cat-extreme';
      return `<div class=\"heat-cell ${cls}\" data-hour=\"${i}\" data-value=\"${v}\"></div>`;
    }).join('');
    heatLegend.innerHTML = '<span><div class="swatch" style="background:#1c2533"></div>0</span><span><div class="swatch" style="background:#114a4a"></div>1-2</span><span><div class="swatch" style="background:#0b7a7a"></div>3-5</span><span><div class="swatch" style="background:#05b5b5"></div>6-10</span><span><div class="swatch" style="background:#03e2e2"></div>11+</span>';
  }
  // Tooltip events
  heatmapEl.querySelectorAll('.heat-cell').forEach(cell => {
    cell.addEventListener('mouseenter', e => {
      const h = cell.getAttribute('data-hour');
      const v = cell.getAttribute('data-value') || 0;
      heatTooltip.textContent = `${h}:00 — ${v} articles`;
      heatTooltip.style.display='block';
      heatTooltip.setAttribute('aria-hidden','false');
    });
    cell.addEventListener('mousemove', e => {
      heatTooltip.style.left = e.clientX + 'px';
      heatTooltip.style.top = e.clientY + 'px';
    });
    cell.addEventListener('mouseleave', () => {
      heatTooltip.style.display='none';
      heatTooltip.setAttribute('aria-hidden','true');
    });
  });
}

function renderPanels() {
  // source stats
  sourceStatsEl.innerHTML = Object.entries(meta.sourceStats||{}).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([s,c])=>`<li><span>${s}</span><span class="value">${c}</span></li>`).join('');
  categoryStatsEl.innerHTML = (meta.categories||[]).slice(0,12).map(c=>`<li><span>${c.category}</span><span class="value">${c.count}</span></li>`).join('');
  renderHeatmap();
}

function render() {
  const q = searchEl.value.toLowerCase();
  let items = allItems;
  if (activeSource) items = items.filter(i=>i.source===activeSource);
  if (bookmarkView) items = items.filter(i=>bookmarks.has(i.id));
  if (q) items = items.filter(i => i.title.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q));

  if (!grouped) {
    listEl.innerHTML = items.map(decorateArticleHTML).join('');
  } else {
    // group by first category else 'other'
    const groups = {};
    items.forEach(it => {
      const key = it.categories && it.categories.length ? it.categories[0] : 'other';
      (groups[key] = groups[key] || []).push(it);
    });
    listEl.innerHTML = Object.entries(groups).sort((a,b)=>b[1].length - a[1].length).map(([cat, arr])=>`
      <li class="news-item group-block"><h2>${cat.toUpperCase()} <span style="opacity:.6; font-size:.7rem;">(${arr.length})</span></h2>
        <ul class="group-list">${arr.map(decorateArticleHTML).join('')}</ul>
      </li>`).join('');
  }

  // Card interactions
  listEl.querySelectorAll('.news-item').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.classList.contains('bookmark-btn') || e.target.classList.contains('read-terminal')) return;
      const btn = card.querySelector('.read-terminal');
      if (btn) {
        const article = JSON.parse(btn.getAttribute('data-article').replace(/&#39;/g, "'"));
        openTerminal(article);
      }
    });
  });
  listEl.querySelectorAll('.read-terminal').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const article = JSON.parse(btn.getAttribute('data-article').replace(/&#39;/g, "'"));
    openTerminal(article);
  }));
  listEl.querySelectorAll('.bookmark-btn').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const li = btn.closest('.news-item');
    const id = li.getAttribute('data-id');
    if (bookmarks.has(id)) bookmarks.delete(id); else bookmarks.add(id);
    localStorage.setItem('bookmarks', JSON.stringify(Array.from(bookmarks)));
    render();
  }));

  renderTrending();
  buildSourceChips();
  renderPanels();
}

searchEl.addEventListener('input', render);
groupToggle.addEventListener('click', () => {
  grouped = !grouped; groupToggle.setAttribute('aria-pressed', grouped); groupToggle.textContent = `Group: ${grouped?'On':'Off'}`; render();
});
bookmarkToggle.addEventListener('click', () => {
  bookmarkView = !bookmarkView; bookmarkToggle.setAttribute('aria-pressed', bookmarkView); render();
});
themeToggle.addEventListener('click', () => {
  const order = ['default','magenta','matrix'];
  const idx = order.indexOf(currentTheme);
  currentTheme = order[(idx+1)%order.length];
  localStorage.setItem('theme', currentTheme);
  applyTheme();
});

// Heatmap mode toggle
heatmapModeBtn?.addEventListener('click', () => {
  // animated transition
  heatmapEl.classList.add('mode-switch-out');
  setTimeout(() => {
    heatmapMode = heatmapMode === 'log' ? 'category' : 'log';
    heatmapModeBtn.textContent = `Mode: ${heatmapMode === 'log' ? 'Log' : 'Cat'}`;
    heatmapModeBtn.setAttribute('aria-pressed', heatmapMode === 'category');
    renderHeatmap();
    heatmapEl.classList.remove('mode-switch-out');
    heatmapEl.classList.add('mode-switch-in');
    setTimeout(()=>heatmapEl.classList.remove('mode-switch-in'), 550);
  }, 220);
});

// Heatmap expand toggle
heatmapExpandBtn?.addEventListener('click', () => {
  const panel = document.getElementById('panelHeatmap');
  heatmapExpanded = !heatmapExpanded;
  if (heatmapExpanded) {
    panel.classList.add('expanded');
    heatmapExpandBtn.textContent = 'Close';
  } else {
    panel.classList.remove('expanded');
    heatmapExpandBtn.textContent = 'Expand';
  }
});

window.addEventListener('scroll', () => {
  const sc = (window.scrollY) / (document.documentElement.scrollHeight - window.innerHeight);
  scrollProgress.style.width = (sc*100)+'%';
});

function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  let retry = 0;
  ws.onopen = () => { 
    statusEl.textContent = 'Live'; 
    statusEl.className = 'status ok'; 
  };
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'init') {
        allItems = msg.payload.news || [];
        meta = msg.payload.meta || meta;
        skeletonEl.innerHTML='';
        render();
      } else if (msg.type === 'news') {
        unseenQueue = [...msg.payload, ...unseenQueue];
        newCountEl.textContent = unseenQueue.length;
        newBanner.hidden = false;
      } else if (msg.type === 'meta') {
        meta = msg.payload;
        renderPanels();
      }
    } catch (e) { console.warn('Bad message', e); }
  };
  ws.onclose = () => {
    statusEl.textContent = 'Reconnecting...';
    statusEl.className = 'status err';
    setTimeout(connect, Math.min(10000, 1000 * ++retry));
  };
  ws.onerror = () => {
    statusEl.textContent = 'Error';
    statusEl.className = 'status err';
  };
}

newBanner.addEventListener('click', () => {
  if (unseenQueue.length) {
    allItems = [...unseenQueue, ...allItems];
    unseenQueue = [];
    newBanner.hidden = true;
    render();
  }
});

applyTheme();
// initial skeleton
for (let i=0;i<8;i++) skeletonEl.innerHTML += '<div class="skeleton-card"></div>';
connect();

// Fallback: if no data after 3s, fetch REST
setTimeout(() => {
  if (!allItems.length) {
    fetch('/api/news').then(r => r.json()).then(d => {
      if (d.news) { allItems = d.news; meta = d.meta || meta; skeletonEl.innerHTML=''; render(); }
    }).catch(()=>{});
  }
}, 3000);

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}

// Binance price feed (simplified)
const priceMap = {};
function attachPrices() {
  document.querySelectorAll('.news-item').forEach(li => {
    const title = li.querySelector('h2')?.textContent.toLowerCase() || '';
    let symbol = null;
    if (title.includes('bitcoin') || title.includes('btc')) symbol = 'BTCUSDT';
    else if (title.includes('ethereum') || title.includes('eth')) symbol = 'ETHUSDT';
    if (symbol && priceMap[symbol]) {
      if (!li.querySelector('.price-badge')) {
        const span = document.createElement('span');
        span.className='price-badge';
        span.style.cssText='position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.4); padding:4px 8px; border:1px solid var(--accent); font-size:.6rem; border-radius:8px;';
        span.textContent = symbol.replace('USDT','')+': '+priceMap[symbol];
        li.appendChild(span);
      } else {
        li.querySelector('.price-badge').textContent = symbol.replace('USDT','')+': '+priceMap[symbol];
      }
    }
  });
}

function startPriceWS() {
  try {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        data.forEach(t => {
          const s = t.s; if (s==='BTCUSDT' || s==='ETHUSDT') {
            priceMap[s] = parseFloat(t.c).toFixed(0);
          }
        });
        attachPrices();
      } catch {}
    };
  } catch {}
}
startPriceWS();

// Contract badge copy logic
const contractBadge = document.getElementById('contractBadge');
if (contractBadge) {
  const fullAddr = contractBadge.getAttribute('data-address');
  function copyAddr() {
    if (!fullAddr) return;
    navigator.clipboard?.writeText(fullAddr).catch(()=>{});
    contractBadge.classList.add('copied','show-tip');
    contractBadge.setAttribute('data-tooltip','Copied');
    setTimeout(()=>contractBadge.classList.remove('show-tip'),1200);
    setTimeout(()=>contractBadge.classList.remove('copied'),900);
  }
  contractBadge.addEventListener('click', copyAddr);
  contractBadge.addEventListener('keydown', (e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); copyAddr(); }});
  contractBadge.addEventListener('mouseenter', ()=>{ contractBadge.setAttribute('data-tooltip','Copy'); contractBadge.classList.add('show-tip'); });
  contractBadge.addEventListener('mouseleave', ()=>{ contractBadge.classList.remove('show-tip'); });
}
