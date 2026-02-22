const SK = 'lc_state';

// All features — spotlight and epilepsy removed permanently
const GROUPS = [
  {
    label: 'Reading',
    features: [
      { key: 'dyslexiaFont',   emoji: '🔤', label: 'Dyslexia Font'     },
      { key: 'readingRuler',   emoji: '📏', label: 'Reading Ruler'     },
      { key: 'linkHighlight',  emoji: '🔗', label: 'Highlight Links'   },
    ]
  },
  {
    label: 'Display',
    features: [
      { key: 'highContrast',   emoji: '🌗', label: 'High Contrast'     },
      { key: 'largeText',      emoji: '🔍', label: 'Large Text'        },
      { key: 'colorBlind',     emoji: '👁️', label: 'Color Blind Mode'  },
    ]
  },
  {
    label: 'Page',
    features: [
      { key: 'elementRemover', emoji: '🖊️', label: 'Element Remover'   },
      { key: 'bigTargets',     emoji: '🖱️', label: 'Big Click Targets' },
      { key: 'pageOutline',    emoji: '🗂️', label: 'Page Outline'      },
      { key: 'stopAnimations', emoji: '⏸️', label: 'Stop Animations'   },
    ]
  }
];

const ALL_FEATS = GROUPS.flatMap(g => g.features);

// Default shortcuts — only for features that had them before
const DEFAULT_SC = {
  dyslexiaFont:  'D',
  readingRuler:  'R',
  highContrast:  'C',
  pageOutline:   'O',
};

const DEFAULT = {
  toggles: {}, hiddenFeatures: [],
  readingLevel: 'simple', readSpeed: 1,
  spacingIntensity: 2, fontSizeLevel: 125,
  colorBlindType: 'none', theme: 'dark',
  shortcuts: { ...DEFAULT_SC },
};

let state = { ...DEFAULT };
let _saving = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const s = await chrome.storage.local.get([SK]);
  if (s[SK]) state = merge(DEFAULT, s[SK]);
  applyTheme();
  buildTools();
  buildShortcuts();
  buildVisRows();
  syncUI();
  bindEvents();
});

// ─── Storage change listener — keeps panel in sync with shortcuts ─────────────
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes[SK] || _saving) return;
  state = merge(DEFAULT, changes[SK].newValue || {});
  buildTools();   // re-render toggle states
  syncUI();       // sync buttons/sliders
});

function merge(base, over) {
  const r = { ...base };
  for (const k of Object.keys(over)) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k])) r[k] = merge(base[k] || {}, over[k]);
    else r[k] = over[k];
  }
  return r;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme || 'dark');
  applyToPopup();
}

// ─── Build Tools ──────────────────────────────────────────────────────────────
function buildTools() {
  const body   = document.getElementById('tools-body');
  body.innerHTML = '';
  const hidden = new Set(state.hiddenFeatures || []);

  GROUPS.forEach(group => {
    const visible = group.features.filter(f => !hidden.has(f.key));
    if (!visible.length) return;

    const grp = document.createElement('div');
    grp.className = 'grp';

    const lbl = document.createElement('div');
    lbl.className = 'grp-label';
    lbl.textContent = group.label;
    grp.appendChild(lbl);

    visible.forEach(f => {
      const on    = !!state.toggles[f.key];
      const isRem = f.key === 'elementRemover';
      const row   = document.createElement('div');
      row.className = 'trow' + (on ? (isRem ? ' rem-on' : ' on') : '');
      row.dataset.key = f.key;
      row.innerHTML = `
        <span class="ticon">${f.emoji}</span>
        <span class="tlabel">${f.label}</span>
        <div class="sw"><div class="sw-track"></div><div class="sw-thumb"></div></div>
      `;
      grp.appendChild(row);
    });

    body.appendChild(grp);
  });

  // Remover sub-button visibility
  document.getElementById('rem-sub').classList.toggle('show', !!state.toggles.elementRemover);
}

// ─── Build Shortcuts editor ───────────────────────────────────────────────────
function buildShortcuts() {
  const sc   = state.shortcuts || {};
  const rows = document.getElementById('sc-rows');
  rows.innerHTML = '';

  ALL_FEATS.forEach(f => {
    const row = document.createElement('div');
    row.className = 'sc-row';
    row.innerHTML = `
      <span class="sc-feat">${f.emoji} ${f.label}</span>
      <div class="sc-combo">
        <span class="sc-prefix">Alt+Shift+</span>
        <input class="sc-key" type="text" maxlength="1"
               placeholder="—"
               value="${sc[f.key] || ''}"
               data-sc="${f.key}" />
      </div>
    `;
    rows.appendChild(row);
  });
}

// ─── Build Visibility list ────────────────────────────────────────────────────
function buildVisRows() {
  const hidden = new Set(state.hiddenFeatures || []);
  const rows   = document.getElementById('vis-rows');
  rows.innerHTML = '';

  ALL_FEATS.forEach(f => {
    const isHidden = hidden.has(f.key);
    const row = document.createElement('div');
    row.className = 'vis-row' + (isHidden ? ' off' : '');
    row.dataset.key = f.key;
    row.innerHTML = `<span class="vis-name">${f.emoji} ${f.label}</span><span class="vis-tick">${isHidden ? '—' : '✓'}</span>`;
    rows.appendChild(row);
  });
}

// ─── Sync button/slider states ────────────────────────────────────────────────
function syncUI() {
  const count = Object.values(state.toggles).filter(Boolean).length;
  const badge = document.getElementById('badge');
  badge.textContent = count; badge.classList.toggle('on', count > 0);
  document.getElementById('dot').classList.toggle('on', count > 0);
  document.getElementById('stxt').textContent = count > 0 ? `${count} active` : 'Nothing active';

  document.querySelectorAll('[data-level]').forEach(b => b.classList.toggle('on', b.dataset.level === state.readingLevel));
  document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', parseFloat(b.dataset.speed) === state.readSpeed));
  document.querySelectorAll('[data-cb]').forEach(b => b.classList.toggle('on', b.dataset.cb === (state.colorBlindType || 'none')));
  document.querySelectorAll('[data-theme-btn]').forEach(b => b.classList.toggle('on', b.dataset.themeBtn === (state.theme || 'dark')));

  document.getElementById('sl-spacing').value  = state.spacingIntensity;
  document.getElementById('sl-fontsize').value = state.fontSizeLevel;

  // Sync shortcut inputs (may have been updated by another context)
  document.querySelectorAll('[data-sc]').forEach(inp => {
    inp.value = (state.shortcuts || {})[inp.dataset.sc] || '';
  });

  applyToPopup();
}

// ─── Apply active features to popup itself ────────────────────────────────────
function applyToPopup() {
  const t    = state.toggles || {};
  const body = document.body;
  const root = document.documentElement;

  if (t.dyslexiaFont) {
    const sp = {1:'0.04em',2:'0.09em',3:'0.14em'}[state.spacingIntensity]||'0.09em';
    const lh = {1:'1.5',2:'1.7',3:'2.0'}[state.spacingIntensity]||'1.7';
    body.style.fontFamily='Arial,Helvetica,sans-serif'; body.style.letterSpacing=sp; body.style.lineHeight=lh; body.style.wordSpacing='0.08em';
  } else { body.style.fontFamily=body.style.letterSpacing=body.style.lineHeight=body.style.wordSpacing=''; }

  body.style.fontSize = t.largeText ? ((state.fontSizeLevel/100)*13)+'px' : '';

  if (t.highContrast) {
    root.style.setProperty('--text','#fff'); root.style.setProperty('--bg','#000');
    root.style.setProperty('--surf','#0d0d0d'); root.style.setProperty('--surf2','#1a1a1a');
    root.style.setProperty('--sub','#aaa'); root.style.setProperty('--border','#555');
    root.style.setProperty('--accent','#7eb6ff');
  } else {
    ['--text','--bg','--surf','--surf2','--sub','--border','--accent'].forEach(v => root.style.removeProperty(v));
    document.documentElement.setAttribute('data-theme', state.theme||'dark');
  }

  let noAnim = document.getElementById('lc-no-anim');
  if (t.stopAnimations) {
    if (!noAnim) { noAnim=document.createElement('style'); noAnim.id='lc-no-anim'; noAnim.textContent='*,*::before,*::after{animation:none!important;transition-duration:.001ms!important}'; document.head.appendChild(noAnim); }
  } else { noAnim?.remove(); }
}

// ─── Events ───────────────────────────────────────────────────────────────────
function bindEvents() {
  // Tabs
  document.querySelectorAll('.tab').forEach(tab =>
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('pane-'+tab.dataset.tab).classList.add('active');
    })
  );

  // Tool rows
  document.getElementById('tools-body').addEventListener('click', e => {
    const row = e.target.closest('.trow');
    if (!row) return;
    state.toggles[row.dataset.key] = !state.toggles[row.dataset.key];
    save(); push(); buildTools(); syncUI();
  });

  // Remover
  document.getElementById('rem-reset').addEventListener('click', () => push({ type:'REMOVER_RESET_PAGE' }));
  document.getElementById('clear-rem').addEventListener('click', async () => {
    if (!confirm('Remove all saved element removals across all sites?')) return;
    const all = await chrome.storage.local.get(null);
    const keys = Object.keys(all).filter(k => k.startsWith('lc_rem_'));
    if (keys.length) await chrome.storage.local.remove(keys);
    push({ type:'REMOVER_RESET_PAGE' });
    alert('Done.');
  });

  // Shortcut key inputs
  document.getElementById('sc-rows').addEventListener('input', e => {
    const inp = e.target.closest('[data-sc]');
    if (!inp) return;
    const letter = inp.value.toUpperCase().replace(/[^A-Z]/g,'');
    inp.value = letter;
    if (!state.shortcuts) state.shortcuts = { ...DEFAULT_SC };
    state.shortcuts[inp.dataset.sc] = letter;
    save();
    push({ type:'UPDATE_SHORTCUTS', shortcuts: state.shortcuts });
  });

  // Visibility
  document.getElementById('vis-rows').addEventListener('click', e => {
    const row = e.target.closest('.vis-row');
    if (!row) return;
    const hidden = new Set(state.hiddenFeatures||[]);
    hidden.has(row.dataset.key) ? hidden.delete(row.dataset.key) : hidden.add(row.dataset.key);
    state.hiddenFeatures = [...hidden];
    save(); buildTools(); buildVisRows(); syncUI();
  });

  // Theme
  document.querySelectorAll('[data-theme-btn]').forEach(b =>
    b.addEventListener('click', () => {
      state.theme = b.dataset.themeBtn;
      document.querySelectorAll('[data-theme-btn]').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); save(); applyTheme();
    })
  );

  // CB / level / speed
  document.querySelectorAll('[data-cb]').forEach(b => b.addEventListener('click', () => { state.colorBlindType=b.dataset.cb; document.querySelectorAll('[data-cb]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); save(); push(); }));
  document.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => { state.readingLevel=b.dataset.level; document.querySelectorAll('[data-level]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); save(); }));
  document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => { state.readSpeed=parseFloat(b.dataset.speed); document.querySelectorAll('[data-speed]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); save(); }));

  // Sliders
  document.getElementById('sl-spacing').addEventListener('input', e => { state.spacingIntensity=parseInt(e.target.value); save(); push(); applyToPopup(); });
  document.getElementById('sl-fontsize').addEventListener('input', e => { state.fontSizeLevel=parseInt(e.target.value); save(); push(); applyToPopup(); });

  // Reset
  document.getElementById('reset-all').addEventListener('click', async () => {
    if (!confirm('Reset all Lucid settings?')) return;
    state = { ...DEFAULT, shortcuts: { ...DEFAULT_SC } };
    await save(); push(); applyTheme(); buildTools(); buildShortcuts(); buildVisRows(); syncUI();
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function save() {
  _saving = true;
  return chrome.storage.local.set({ [SK]: state }, () => { setTimeout(() => { _saving = false; }, 50); });
}

function push(overrideMsg) {
  chrome.tabs.query({ active:true, currentWindow:true }, tabs => {
    if (!tabs[0]) return;
    const msg = overrideMsg || { type:'APPLY_STATE', state };
    chrome.tabs.sendMessage(tabs[0].id, msg, () => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript({ target:{ tabId:tabs[0].id }, files:['content.js'] },
          () => chrome.tabs.sendMessage(tabs[0].id, msg));
      }
    });
  });
}
