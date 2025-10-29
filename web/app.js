// Particle background - optimized for mobile
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId;

// Detect if device is mobile for performance optimization
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

function resize() { 
  canvas.width = window.innerWidth; 
  canvas.height = window.innerHeight; 
}

window.addEventListener('resize', resize); 
resize();

// Reduce particle count on mobile for better performance
const particleCount = isMobile ? 50 : 110;

for (let i = 0; i < particleCount; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    dx: (Math.random() - 0.5) * (isMobile ? 0.15 : 0.25),
    dy: (Math.random() - 0.5) * (isMobile ? 0.15 : 0.25),
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
  animationId = requestAnimationFrame(drawParticles);
}

// Pause animation when page is not visible (battery optimization)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
  } else {
    drawParticles();
  }
});

animationId = requestAnimationFrame(drawParticles);

// Welcome Modal on First Visit
function showWelcomeModal() {
  // Check URL parameter first
  const forceWelcome = checkWelcomeParam();
  const hasVisited = localStorage.getItem('super-divergent-visited');
  
  console.log('🔍 Checking welcome modal...', { hasVisited, forceWelcome });
  
  if (!hasVisited || forceWelcome) {
    const welcomeModal = document.getElementById('welcomeModal');
    console.log('Welcome modal element:', welcomeModal);
    
    if (welcomeModal) {
      welcomeModal.classList.add('show');
      console.log('Welcome modal shown');
      
      // Typing effect for the message
      setTimeout(() => {
        typeWelcomeMessage();
      }, 1000);
    } else {
      console.error('Welcome modal element not found!');
    }
  }
}

function typeWelcomeMessage() {
  const messageElement = document.querySelector('.message-content p');
  const fullMessage = messageElement.textContent;
  messageElement.textContent = '';
  
  let i = 0;
  const typeSpeed = 30;
  
  function typeChar() {
    if (i < fullMessage.length) {
      messageElement.textContent += fullMessage.charAt(i);
      i++;
      setTimeout(typeChar, typeSpeed);
    } else {
      // Show contract section after message is complete
      setTimeout(() => {
        document.querySelector('.contract-section').style.opacity = '1';
        document.querySelector('.welcome-actions').style.opacity = '1';
      }, 500);
    }
  }
  
  // Initially hide contract section and actions
  document.querySelector('.contract-section').style.opacity = '0';
  document.querySelector('.welcome-actions').style.opacity = '0';
  
  typeChar();
}

function closeWelcomeModal() {
  const welcomeModal = document.getElementById('welcomeModal');
  console.log('Closing welcome modal');
  
  welcomeModal.style.animation = 'fadeOut 0.3s ease-out';
  
  setTimeout(() => {
    welcomeModal.classList.remove('show');
    welcomeModal.style.animation = '';
    // Mark as visited
    localStorage.setItem('super-divergent-visited', 'true');
    console.log('Welcome modal closed and marked as visited');
  }, 300);
}

// Welcome Modal Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired');
  initWelcomeModal();
});

function showWelcomeCopyNotification() {
  const copyBtn = document.getElementById('copyWelcomeContract');
  const originalText = copyBtn.innerHTML;
  
  copyBtn.innerHTML = '✅';
  copyBtn.style.background = 'linear-gradient(135deg, rgba(0, 255, 100, 0.4), rgba(0, 200, 255, 0.4))';
  
  setTimeout(() => {
    copyBtn.innerHTML = originalText;
    copyBtn.style.background = 'linear-gradient(135deg, rgba(0, 255, 193, 0.2), rgba(255, 0, 255, 0.2))';
  }, 1500);
}

// Add fadeOut animation to CSS
const welcomeCSS = document.createElement('style');
welcomeCSS.textContent = `
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
`;
document.head.appendChild(welcomeCSS);

// Fallback if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  // DOM is still loading
} else {
  // DOM is already loaded
  console.log('DOM already loaded, initializing welcome modal...');
  initWelcomeModal();
}

function initWelcomeModal() {
  const welcomeOkBtn = document.getElementById('welcomeOk');
  const welcomeCloseBtn = document.getElementById('welcomeClose');
  const welcomeCloseX = document.querySelector('.welcome-close');
  const copyWelcomeBtn = document.getElementById('copyWelcomeContract');
  
  console.log('Welcome modal elements:', {
    okBtn: welcomeOkBtn,
    closeBtn: welcomeCloseBtn,
    closeX: welcomeCloseX,
    copyBtn: copyWelcomeBtn
  });
  
  // Close modal events
  if (welcomeOkBtn) welcomeOkBtn.addEventListener('click', closeWelcomeModal);
  if (welcomeCloseBtn) welcomeCloseBtn.addEventListener('click', closeWelcomeModal);
  if (welcomeCloseX) welcomeCloseX.addEventListener('click', closeWelcomeModal);
  
  // Copy contract from welcome modal
  if (copyWelcomeBtn) {
    copyWelcomeBtn.addEventListener('click', () => {
      const contractAddress = document.getElementById('welcomeContractAddress').textContent;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(contractAddress).then(() => {
          showWelcomeCopyNotification();
        }).catch(() => {
          fallbackCopy(contractAddress);
        });
      } else {
        fallbackCopy(contractAddress);
      }
    });
  }
  
  // Show welcome modal on first visit
  console.log('Scheduling welcome modal...');
  setTimeout(showWelcomeModal, 1000);
}

// Debug function to reset welcome modal (for testing)
// Type resetWelcome() in browser console to test again
window.resetWelcome = function() {
  localStorage.removeItem('super-divergent-visited');
  console.log('🔄 Welcome modal reset! Reloading page...');
  location.reload();
};

// Check if user wants to see welcome again via URL parameter
// Add ?welcome=true to URL to force show welcome modal
function checkWelcomeParam() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('welcome') === 'true') {
    localStorage.removeItem('super-divergent-visited');
    console.log('🎯 Welcome forced via URL parameter');
    // Remove the parameter from URL after processing
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({path: newUrl}, '', newUrl);
    return true;
  }
  return false;
}

// Debug info logging
console.log('🚀 Super Divergent AI - Debug Info:');
console.log('📋 Welcome Modal Status:', localStorage.getItem('super-divergent-visited') ? 'Already shown' : 'Will show on load');
console.log('🔧 Reset Welcome: Type resetWelcome() in console');
console.log('🔗 Force Welcome: Add ?welcome=true to URL');
console.log('⚡ Force Welcome Now: Type forceWelcome() in console');

// Force show welcome modal for testing
window.forceWelcome = function() {
  const welcomeModal = document.getElementById('welcomeModal');
  if (welcomeModal) {
    welcomeModal.classList.add('show');
    console.log('Welcome modal forced to show');
  } else {
    console.error('Welcome modal not found');
  }
};

// Welcome Banner Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const showWelcomeInfoBtn = document.getElementById('showWelcomeInfo');
  const copyContractBtn = document.getElementById('copyContractBanner');
  
  // Show welcome info modal
  if (showWelcomeInfoBtn) {
    showWelcomeInfoBtn.addEventListener('click', () => {
      const welcomeModal = document.getElementById('welcomeModal');
      if (welcomeModal) {
        welcomeModal.classList.add('show');
        typeWelcomeMessage();
      }
    });
  }
  
  // Copy contract from banner
  if (copyContractBtn) {
    copyContractBtn.addEventListener('click', () => {
      const contractAddress = '0x1234567890abcdef1234567890ABCDEF12345678';
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(contractAddress).then(() => {
          showBannerCopySuccess();
        }).catch(() => {
          fallbackCopy(contractAddress);
        });
      } else {
        fallbackCopy(contractAddress);
      }
    });
  }
});

function showBannerCopySuccess() {
  const copyBtn = document.getElementById('copyContractBanner');
  const contractText = copyBtn.querySelector('.contract-text');
  const contractIcon = copyBtn.querySelector('.contract-icon');
  
  // Store original values
  const originalText = contractText.textContent;
  const originalIcon = contractIcon.textContent;
  
  // Show success state
  contractText.textContent = 'Copied!';
  contractIcon.textContent = '✅';
  copyBtn.classList.add('copied');
  
  // Reset after 2 seconds
  setTimeout(() => {
    contractText.textContent = originalText;
    contractIcon.textContent = originalIcon;
    copyBtn.classList.remove('copied');
  }, 2000);
}

// Debug localStorage
console.log('Current localStorage visited status:', localStorage.getItem('super-divergent-visited'));

// Navigation toggle for mobile
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

// Toggle mobile menu
navToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  navMenu.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
    navMenu.classList.remove('active');
  }
});

// Close mobile menu on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu.classList.contains('active')) {
    navMenu.classList.remove('active');
  }
});

// Close mobile menu on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    navMenu.classList.remove('active');
  }
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
        const trendingSection = document.getElementById('trendingSection');
        if (trendingSection) {
          trendingSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          // Scroll to dashboard if trending section doesn't exist
          document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (target === '#sources') {
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
          dashboard.scrollIntoView({ behavior: 'smooth' });
        } else {
          document.getElementById('newsList')?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      // External links - close mobile menu
      navMenu.classList.remove('active');
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

function generateStats() {
  // Generate source stats from current items
  const sourceStats = {};
  const categoryStats = {};
  
  allItems.forEach(item => {
    // Count sources
    if (item.source) {
      sourceStats[item.source] = (sourceStats[item.source] || 0) + 1;
    }
    
    // Generate categories from keywords in titles and descriptions
    const text = (item.title + ' ' + (item.description || '')).toLowerCase();
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'crypto', 'defi', 
      'nft', 'solana', 'cardano', 'binance', 'trading', 'mining', 'wallet',
      'altcoin', 'doge', 'market', 'price', 'bull', 'bear', 'hodl', 'investment'
    ];
    
    cryptoKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        const category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      }
    });
  });
  
  // Update meta with generated stats
  meta.sourceStats = sourceStats;
  meta.categories = Object.entries(categoryStats)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

function renderPanels() {
  // Only render heatmap now that source/category panels are removed
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
  // Check if we're in production (Vercel)
  const isProduction = location.hostname.includes('vercel.app') || location.hostname.includes('vercel.com') || location.protocol === 'https:';
  
  if (isProduction) {
    // Use polling for Vercel (no persistent WebSocket support)
    console.log('🔄 Using polling mode for production');
    statusEl.textContent = 'Live (Polling)';
    statusEl.className = 'status ok';
    
    // Initial fetch
    fetchNewsPolling();
    
    // Poll every 30 seconds
    setInterval(fetchNewsPolling, 30000);
    return;
  }
  
  // Local WebSocket connection
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

// Polling function for production
async function fetchNewsPolling() {
  try {
    statusEl.textContent = 'Fetching...';
    statusEl.className = 'status ok';
    
    const response = await fetch('/api/news');
    const data = await response.json();
    
    allItems = data.news || [];
    meta = data.meta || meta;
    
    skeletonEl.innerHTML = '';
    render();
    
    statusEl.textContent = 'Live (Polling)';
    statusEl.className = 'status ok';
  } catch (error) {
    console.error('Polling error:', error);
    statusEl.textContent = 'Error';
    statusEl.className = 'status err';
  }
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

// Copy contract function for footer
function copyContract() {
  const contractAddress = '0x1234567890abcdef1234567890ABCDEF12345678';
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(contractAddress).then(() => {
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'copy-notification';
      notification.textContent = 'Contract address copied!';
      notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, var(--accent), var(--accent2));
        color: #000;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(0,255,193,0.4);
        animation: slideIn 0.3s ease-out;
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      fallbackCopy(contractAddress);
    });
  } else {
    fallbackCopy(contractAddress);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    alert('Contract address copied to clipboard!');
  } catch (err) {
    console.error('Could not copy text: ', err);
    alert('Contract: ' + text);
  }
  
  document.body.removeChild(textArea);
}

// Add CSS for notifications
const notificationCSS = document.createElement('style');
notificationCSS.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(notificationCSS);

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
