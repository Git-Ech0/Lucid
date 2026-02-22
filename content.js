// ─── Lucid Content Script v6 ──────────────────────────────────────────────────
(function () {
  'use strict';

  const SK         = 'lc_state';
  const REMOVER_PRE = 'lc_rem_';

  let activeState = null;
  const speechSynth = window.speechSynthesis;

  // Ruler
  let rulerEl = null, rulerRaf = null, rulerMouseY = 0, rulerY = -200;

  // Page outline
  let outlinePanel = null;

  // Element remover
  let removerActive   = false;
  let removerHoverEl  = null;
  let removerObserver = null;

  // Shortcuts
  let customShortcuts = {};

  // Navigation
  let lastHref    = location.href;

  // ─── Message listener ────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _s, respond) => {
    switch (msg.type) {
      case 'APPLY_STATE':
        activeState = msg.state;
        customShortcuts = msg.state.shortcuts || {};
        applyAll(msg.state);
        respond({ ok: true });
        break;
      case 'UPDATE_SHORTCUTS':
        customShortcuts = msg.shortcuts || {};
        respond({ ok: true });
        break;
      case 'AI_SEL':
        aiOnSelection(msg.mode, msg.level).then(() => respond({ ok: true })).catch(() => respond({ ok: false }));
        return true;
      case 'READ_ALOUD':      readAloud(msg.speed); respond({ ok: true }); break;
      case 'SUMMARIZE_PAGE':  summarizePage().then(() => respond({ ok: true })).catch(() => respond({ ok: false })); return true;
      case 'DESCRIBE_IMAGE':  describeImageAI(msg.srcUrl).then(() => respond({ ok: true })).catch(() => respond({ ok: false })); return true;
      case 'FORM_HELP':       formHelp().then(() => respond({ ok: true })).catch(() => respond({ ok: false })); return true;
      case 'REMOVER_RESET_PAGE': removerResetPage(); respond({ ok: true }); break;
    }
    return true;
  });

  // ─── Master apply ─────────────────────────────────────────────────────────
  function applyAll(s) {
    const t = s.toggles || {};
    applyDyslexiaFont(t.dyslexiaFont, s.spacingIntensity);
    applyReadingRuler(t.readingRuler);
    applyHighContrast(t.highContrast);
    applyLargeText(t.largeText, s.fontSizeLevel);
    applyLinkHighlight(t.linkHighlight);
    applyColorBlind(t.colorBlind, s.colorBlindType);
    applyElementRemover(t.elementRemover);
    applyBigTargets(t.bigTargets);
    applyPageOutline(t.pageOutline);
    applyStopAnimations(t.stopAnimations);
  }

  // ─── DYSLEXIA FONT ───────────────────────────────────────────────────────
  function applyDyslexiaFont(on, intensity = 2) {
    removeStyle('lc-dyslexia');
    if (!on) return;
    const s = {1:{l:'0.05em',w:'0.1em',lh:'1.5'},2:{l:'0.12em',w:'0.18em',lh:'1.8'},3:{l:'0.2em',w:'0.25em',lh:'2.2'}}[intensity]||{l:'0.12em',w:'0.18em',lh:'1.8'};
    injectStyle('lc-dyslexia', `
      body * { font-family: Arial, Helvetica, sans-serif !important; }
      p,li,td,th,label,blockquote,figcaption,h1,h2,h3,h4,h5,h6,
      span:not([class*="icon"]):not([class*="fa"]) {
        letter-spacing:${s.l}!important;word-spacing:${s.w}!important;line-height:${s.lh}!important;
      }
      p,li,blockquote { max-width:72ch!important; }
    `);
  }

  // ─── READING RULER ───────────────────────────────────────────────────────
  function applyReadingRuler(on) {
    if (!on) {
      cancelAnimationFrame(rulerRaf); rulerRaf = null;
      rulerEl?.remove(); rulerEl = null;
      document.removeEventListener('mousemove', onRulerMove);
      return;
    }
    if (rulerEl) return;
    rulerEl = document.createElement('div');
    rulerEl.id = 'lc-ruler';
    Object.assign(rulerEl.style, {
      position:'fixed',left:'0',top:'0',width:'100%',height:'26px',
      background:'rgba(108,143,255,0.13)',
      borderTop:'2px solid rgba(108,143,255,0.55)',
      borderBottom:'2px solid rgba(108,143,255,0.55)',
      pointerEvents:'none',zIndex:'2147483640',
      willChange:'transform',transform:'translateY(-200px)',
    });
    document.body.appendChild(rulerEl);
    document.addEventListener('mousemove', onRulerMove, { passive: true });
    rulerLoop();
  }
  function onRulerMove(e) { rulerMouseY = e.clientY; }
  function rulerLoop() {
    if (!rulerEl) return;
    rulerY += (rulerMouseY - rulerY) * 0.25;
    rulerEl.style.transform = `translateY(${Math.round(rulerY - 13)}px)`;
    rulerRaf = requestAnimationFrame(rulerLoop);
  }

  // ─── HIGH CONTRAST ───────────────────────────────────────────────────────
  function isLcEl(el) { return el?.id?.startsWith('lc-') || !!el?.closest?.('#lc-outline,#lc-panel,#lc-toast'); }

  // ─── HIGH CONTRAST ───────────────────────────────────────────────────────
  function applyHighContrast(on) {
    removeStyle('lc-contrast');
    if (!on) return;
    injectStyle('lc-contrast', `
      html{background:#000!important}body{background:#0a0a0a!important;color:#f0f0f0!important}
      p,li,td,th,label,blockquote,figcaption,h1,h2,h3,h4,h5,h6{color:#efefef!important;background-color:transparent!important}
      [class*="card"],[class*="panel"],[class*="box"],article,section,main,header,footer,nav{background:#111!important;border-color:#333!important}
      a{color:#7eb6ff!important}a:visited{color:#c0a0ff!important}
      button,[role="button"]{background:#1a1a2e!important;color:#fff!important;border-color:#4466cc!important}
      input,textarea,select{background:#111!important;color:#f0f0f0!important;border-color:#444!important}
      img,video{filter:brightness(0.85) contrast(1.15)}
    `);
  }

  function applyLargeText(on, level = 125) {
    removeStyle('lc-largetext');
    if (!on) return;
    injectStyle('lc-largetext', `:root{font-size:${level}%!important}body{font-size:${level}%!important}`);
  }

  function applyLinkHighlight(on) {
    removeStyle('lc-links');
    if (!on) return;
    injectStyle('lc-links', `
      a:not([class*="icon"]):not([class*="btn"]):not([role="button"]){
        text-decoration:underline!important;text-underline-offset:3px!important;
        text-decoration-thickness:2px!important;text-decoration-color:rgba(108,143,255,.8)!important;
        font-weight:600!important;color:#5a8eff!important;
      }
      a:hover{background:rgba(108,143,255,.12)!important;border-radius:3px!important}
    `);
  }

  // ─── COLOR BLIND MODE ────────────────────────────────────────────────────
  function applyColorBlind(on, type = 'none') {
    removeStyle('lc-cb-css'); document.getElementById('lc-cb-svg')?.remove();
    if (!on || type === 'none') return;
    const matrices = {
      deuteranopia:'0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0',
      protanopia:  '0.152 1.053 -0.205 0 0  0.115 0.786 0.099 0 0  -0.004 -0.048 1.052 0 0 0 0 0 1 0',
      tritanopia:  '1.256 -0.077 -0.179 0 0 -0.078 0.931 0.148 0 0  0.005 0.691 0.304 0 0  0 0 0 1 0',
    };
    const matrix = matrices[type]; if (!matrix) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg  = document.createElementNS(ns,'svg'); svg.id='lc-cb-svg';
    svg.setAttribute('style','position:absolute;width:0;height:0;overflow:hidden;');
    svg.setAttribute('aria-hidden','true');
    const defs=document.createElementNS(ns,'defs'), filt=document.createElementNS(ns,'filter'), cm=document.createElementNS(ns,'feColorMatrix');
    filt.setAttribute('id','lc-cb-filter'); cm.setAttribute('type','matrix'); cm.setAttribute('values',matrix);
    filt.appendChild(cm); defs.appendChild(filt); svg.appendChild(defs);
    document.body.insertBefore(svg, document.body.firstChild);
    injectStyle('lc-cb-css',`html{filter:url(#lc-cb-filter)!important}`);
  }

  // ─── ELEMENT REMOVER ─────────────────────────────────────────────────────
  function applyElementRemover(on) {
    if (!on) { exitRemoverMode(); return; }
    enterRemoverMode();
  }

  function enterRemoverMode() {
    if (removerActive) return;
    removerActive = true;
    injectStyle('lc-rem-hover', `.lc-rem-hover{outline:2px dashed rgba(248,113,113,.85)!important;outline-offset:2px!important;cursor:crosshair!important;background:rgba(248,113,113,.07)!important;}`);
    document.addEventListener('mouseover', onRemOver, { passive: true });
    document.addEventListener('mouseout',  onRemOut,  { passive: true });
    document.addEventListener('click',     onRemClick, true);
    applyStoredRemovals();
    toast('Element Remover on. Click any element to hide it.', 'info', 4000);
  }

  function exitRemoverMode() {
    if (!removerActive) return;
    removerActive = false;
    removerObserver?.disconnect(); removerObserver = null;
    removeStyle('lc-rem-hover');
    document.removeEventListener('mouseover', onRemOver);
    document.removeEventListener('mouseout',  onRemOut);
    document.removeEventListener('click',     onRemClick, true);
    removerHoverEl?.classList.remove('lc-rem-hover'); removerHoverEl = null;
    applyStoredRemovals();
  }

  function onRemOver(e) {
    if (!removerActive || isLcEl(e.target)) return;
    removerHoverEl?.classList.remove('lc-rem-hover');
    removerHoverEl = e.target;
    removerHoverEl.classList.add('lc-rem-hover');
  }
  function onRemOut() { removerHoverEl?.classList.remove('lc-rem-hover'); removerHoverEl = null; }
  function onRemClick(e) {
    if (!removerActive || isLcEl(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    const el = e.target;
    el.classList.remove('lc-rem-hover');
    const record = { selector: getSelector(el), tag: el.tagName, text: el.textContent?.trim().slice(0, 80) || '' };
    hideElement(el);
    storeRemoval(record);
  }

  function getSelector(el) {
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = []; let node = el;
    while (node && node !== document.body && parts.length < 4) {
      let sel = node.tagName.toLowerCase();
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      const cls = [...node.classList].filter(c => !c.startsWith('lc-')).slice(0, 2);
      if (cls.length) sel += '.' + cls.map(CSS.escape).join('.');
      const sibs = node.parentElement ? [...node.parentElement.children].filter(c => c.tagName === node.tagName) : [];
      if (sibs.length > 1) sel += `:nth-of-type(${sibs.indexOf(node)+1})`;
      parts.unshift(sel); node = node.parentElement;
    }
    return parts.join(' > ');
  }

  function hideElement(el) { el.setAttribute('data-lc-hidden','1'); el.style.setProperty('display','none','important'); }

  async function storeRemoval(record) {
    const key = REMOVER_PRE + location.href;
    const res = await chrome.storage.local.get([key]);
    const list = (res[key]||[]).filter(r => r.selector !== record.selector);
    list.push(record);
    await chrome.storage.local.set({ [key]: list });
    startRemoverObserver(list);
  }

  async function applyStoredRemovals() {
    const key  = REMOVER_PRE + location.href;
    const res  = await chrome.storage.local.get([key]);
    const list = res[key] || [];
    list.forEach(hideByRecord);
    if (list.length) startRemoverObserver(list);
  }

  function hideByRecord(r) {
    try { document.querySelectorAll(r.selector).forEach(hideElement); } catch {}
    if (r.text) {
      [...document.getElementsByTagName(r.tag||'*')].forEach(el => {
        if (!el.getAttribute('data-lc-hidden') && el.textContent?.trim().startsWith(r.text.slice(0,40))) hideElement(el);
      });
    }
  }

  function startRemoverObserver(list) {
    removerObserver?.disconnect();
    if (!list.length) return;
    removerObserver = new MutationObserver(mutations => {
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        list.forEach(r => {
          try {
            if (node.matches?.(r.selector)) { hideElement(node); return; }
            node.querySelectorAll(r.selector).forEach(hideElement);
          } catch {}
        });
      }));
    });
    removerObserver.observe(document.body, { childList:true, subtree:true });
  }

  async function removerResetPage() {
    const key = REMOVER_PRE + location.href;
    await chrome.storage.local.remove(key);
    removerObserver?.disconnect(); removerObserver = null;
    document.querySelectorAll('[data-lc-hidden]').forEach(el => {
      el.removeAttribute('data-lc-hidden'); el.style.removeProperty('display');
    });
    toast('All hidden elements restored.', 'success', 2500);
  }

  // ─── BIG CLICK TARGETS ───────────────────────────────────────────────────
  function applyBigTargets(on) {
    removeStyle('lc-targets');
    if (!on) return;
    injectStyle('lc-targets', `
      button,input[type="submit"],input[type="button"],input[type="reset"],
      select,[role="button"],[role="menuitem"],[role="tab"]{
        min-height:44px!important;min-width:44px!important;padding:10px 18px!important;font-size:1em!important;cursor:pointer!important;
      }
      input[type="checkbox"],input[type="radio"]{width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;}
      a:not([role]){padding:6px 2px!important;}
    `);
  }

  // ─── PAGE OUTLINE ────────────────────────────────────────────────────────
  function applyPageOutline(on) {
    if (!on) { outlinePanel?.remove(); outlinePanel = null; return; }
    if (outlinePanel) return;
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h=>h.textContent.trim()).slice(0,50);
    if (!headings.length) { toast('No headings found on this page.', 'info', 2500); return; }

    outlinePanel = mkPanel('lc-outline', { top:'20px', right:'20px', width:'220px', maxHeight:'70vh' }, 'Page Outline');
    outlinePanel.querySelector('.lc-phdr').appendChild(mkCloseBtn(() => { outlinePanel?.remove(); outlinePanel = null; }));

    const list = document.createElement('div'); list.style.padding='4px 0';
    headings.forEach(h => {
      const lv = parseInt(h.tagName[1]);
      const item = document.createElement('div');
      Object.assign(item.style, {
        padding:`6px ${6+(lv-1)*9}px`, fontSize:lv<=2?'12px':'11px',
        fontWeight:lv<=2?'600':'400', color:lv===1?'#e8eaf6':lv===2?'#b0b8d0':'#7c85b0',
        cursor:'pointer', lineHeight:'1.4',
        borderLeft:lv===1?'2px solid rgba(108,143,255,.4)':'none',
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      });
      item.textContent = h.textContent.trim().slice(0,60);
      item.title = h.textContent.trim();
      item.addEventListener('click', () => h.scrollIntoView({ behavior:'smooth', block:'center' }));
      item.addEventListener('mouseenter', () => item.style.background='rgba(108,143,255,.1)');
      item.addEventListener('mouseleave', () => item.style.background='');
      list.appendChild(item);
    });
    outlinePanel.appendChild(list);
    document.body.appendChild(outlinePanel);
  }

  // ─── STOP ANIMATIONS ─────────────────────────────────────────────────────
  function applyStopAnimations(on) {
    removeStyle('lc-animations');
    if (!on) return;
    injectStyle('lc-animations', `
      *,*::before,*::after{animation-duration:.001ms!important;animation-delay:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;transition-delay:.001ms!important;scroll-behavior:auto!important;}
      img[src$=".gif"],img[src*=".gif?"]{filter:blur(4px) grayscale(1)!important;opacity:.4!important;}
      video[autoplay]{display:none!important;}
    `);
  }

  // ─── AI — Pollinations (robust fallback chain) ────────────────────────────
  function extractOpenAIContent(content) {
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
      return content.map(part => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text') return part.text || '';
        return '';
      }).join('').trim();
    }
    return '';
  }

  async function pollinationsOpenAI(messages, model = 'openai') {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages })
    });
    if (!res.ok) throw new Error(`Pollinations OpenAI error (${res.status})`);

    const data = await res.json();
    const text = extractOpenAIContent(data?.choices?.[0]?.message?.content);
    if (!text) throw new Error('Empty Pollinations OpenAI response');
    return text;
  }

  async function pollinationsTextFallback(system, userContent) {
    const prompt = `${system}

User:
${userContent}

Return only the answer.`;
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, {
      method: 'GET',
      credentials: 'omit'
    });
    if (!res.ok) throw new Error(`Pollinations text endpoint error (${res.status})`);
    const text = (await res.text()).trim();
    if (!text) throw new Error('Empty Pollinations text response');
    return text;
  }

  async function ai(system, userContent) {
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: userContent }
    ];

    const modelCandidates = ['openai', 'openai-fast', 'llama'];
    const failures = [];

    for (const model of modelCandidates) {
      try {
        return await pollinationsOpenAI(messages, model);
      } catch (err) {
        failures.push(`${model}: ${err.message}`);
      }
    }

    try {
      return await pollinationsTextFallback(system, userContent);
    } catch (err) {
      failures.push(`text-endpoint: ${err.message}`);
      throw new Error(`AI unavailable. ${failures.join('; ')}`);
    }
  }

  async function aiVision(imageUrl, prompt) {
    let imgContent;
    try {
      const resp = await fetch(imageUrl, { mode:'cors', credentials:'omit' });
      const blob = await resp.blob();
      const b64  = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload  = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(blob);
      });
      imgContent = { type:'image_url', image_url:{ url: b64 } };
    } catch {
      imgContent = { type:'image_url', image_url:{ url: imageUrl } };
    }

    const messages = [{ role:'user', content:[{ type:'text', text: prompt }, imgContent] }];
    const visionModels = ['openai', 'openai-fast'];
    let lastErr = null;

    for (const model of visionModels) {
      try {
        return await pollinationsOpenAI(messages, model);
      } catch (err) {
        lastErr = err;
      }
    }

    throw new Error(`Vision AI unavailable: ${lastErr?.message || 'unknown error'}`);
  }

  // ─── AI ON SELECTION ─────────────────────────────────────────────────────
  async function aiOnSelection(mode, level) {
    const sel  = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) { toast('Select some text first, then right-click.', 'warning'); return; }
    if (text.length > 12000) { toast('Selection too long — try a shorter passage.', 'warning'); return; }

    const range   = sel.getRangeAt(0);
    const startEl = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
    const cs      = getComputedStyle(startEl);

    const origFrag = range.cloneContents();
    const tmp = document.createElement('div'); tmp.appendChild(origFrag);
    const origHTML = tmp.innerHTML;

    const cfgs = {
      simplify: {
        label: 'Simplified',
        sys: `Rewrite this for someone with a reading disability. ${{simple:'6th grade level, simple words, short sentences.',standard:'Clear plain language, 9th grade level.',detailed:'Improve clarity, keep accuracy, explain jargon.'}[level]||'Plain language.'} Return ONLY the rewritten text.`,
        msg: 'Simplifying...',
      },
      explain: {
        label: 'Explained',
        sys: 'Explain this text for someone with cognitive or reading difficulties. Define hard terms. Be concise. Return only the explanation.',
        msg: 'Explaining...',
      },
      translate: {
        label: 'Translated',
        sys: 'Translate to clear plain English. If already English, rewrite to remove confusing idioms. Return only the result.',
        msg: 'Translating...',
      },
    };

    const cfg = cfgs[mode]; if (!cfg) return;
    toast(`${cfg.msg} (~6 seconds)`, 'info', 9000);

    try {
      const result = await ai(cfg.sys, text);
      document.getElementById('lc-toast')?.remove();
      injectReplacement(range, sel, origHTML, result, cfg.label, cs);
    } catch (err) {
      document.getElementById('lc-toast')?.remove(); toast(err.message, 'error');
    }
  }

  function injectReplacement(range, sel, origHTML, replacement, label, cs) {
    const wrap = document.createElement('span');
    Object.assign(wrap.style, {
      fontFamily:   cs.fontFamily,
      fontSize:     cs.fontSize,
      fontWeight:   cs.fontWeight,
      fontStyle:    cs.fontStyle,
      lineHeight:   cs.lineHeight,
      color:        cs.color,
      background:   'rgba(108,143,255,0.1)',
      borderBottom: '2px solid rgba(108,143,255,0.5)',
      borderRadius: '3px',
      padding:      '0 2px',
      cursor:       'pointer',
      display:      'inline',
      whiteSpace:   'pre-wrap',
      wordBreak:    'break-word',
    });

    replacement.split('\n').filter(l=>l.trim()).forEach((line, i) => {
      if (i > 0) wrap.appendChild(document.createElement('br'));
      wrap.appendChild(document.createTextNode(line.trim()));
    });

    const badge = document.createElement('sup');
    badge.textContent = ' ✨';
    Object.assign(badge.style, { fontSize:'.6em', userSelect:'none', cursor:'pointer' });
    badge.title = `${label} by Lucid — click to restore`;
    wrap.appendChild(badge);

    wrap.dataset.origHtml = origHTML;
    wrap.title = 'Click to restore original';
    wrap.addEventListener('click', () => {
      const tmpl = document.createElement('template');
      tmpl.innerHTML = wrap.dataset.origHtml;
      wrap.replaceWith(tmpl.content.cloneNode(true));
    });

    try {
      range.deleteContents(); range.insertNode(wrap); sel.removeAllRanges();
      toast(`${label}. Click highlighted text to restore.`, 'success');
    } catch {
      toast('Could not replace text — try selecting within one paragraph.', 'warning');
    }
  }

  // ─── AI SUMMARIZE PAGE ───────────────────────────────────────────────────
  async function summarizePage() {
    const mainEl = document.querySelector('main,[role="main"],article,.main-content,#content') || document.body;
    const raw    = mainEl.innerText.replace(/\s+/g,' ').trim().slice(0, 8000);
    if (raw.length < 100) { toast('Not enough text on this page.', 'warning'); return; }
    toast('Summarizing... (~8 seconds)', 'info', 14000);
    try {
      const summary = await ai(
        'Summarize this web page for someone with a reading or attention disability. One sentence main point, then 4-5 bullet points (each starting with •). Plain language. Return only the summary.',
        raw
      );
      document.getElementById('lc-toast')?.remove();
      const html = summary.split('\n').filter(l=>l.trim()).map(l=>`<div style="margin-bottom:5px">${esc(l)}</div>`).join('');
      showPanel('Page Summary', html);
    } catch (err) { document.getElementById('lc-toast')?.remove(); toast(err.message,'error'); }
  }

  // ─── AI DESCRIBE IMAGE ───────────────────────────────────────────────────
  async function describeImageAI(srcUrl) {
    if (!srcUrl) { toast('No image URL found.', 'warning'); return; }
    toast('Describing image... (~10 seconds)', 'info', 15000);
    try {
      const desc = await aiVision(
        srcUrl,
        'Write a clear, specific alt-text description of this image for a visually impaired user. Describe exactly what is visible: subjects, actions, colors, text in the image, setting. Use direct declarative sentences. Do not write "I see", "I think", "it appears", "it looks like", "it seems", or similar hedging phrases. 2-4 sentences.'
      );
      document.getElementById('lc-toast')?.remove();
      showPanel('Image Description', esc(desc));
    } catch (err) {
      document.getElementById('lc-toast')?.remove();
      toast('Could not describe this image. It may be blocked by CORS restrictions.', 'error');
    }
  }

  // ─── AI FORM HELP ────────────────────────────────────────────────────────
  async function formHelp() {
    const active = document.activeElement;
    const isInput = active && (active.tagName==='INPUT'||active.tagName==='TEXTAREA'||active.tagName==='SELECT');
    if (!isInput) { toast('Click a form field first, then right-click.', 'warning'); return; }
    const label = document.querySelector(`label[for="${active.id}"]`)?.textContent || active.closest('label')?.textContent || active.getAttribute('aria-label') || active.getAttribute('placeholder') || active.name || 'this field';
    const form  = active.closest('form');
    const ctx   = form ? [...form.querySelectorAll('label,legend')].map(l=>l.textContent.trim()).join(', ') : '';
    toast('Getting help... (~5 seconds)', 'info', 9000);
    try {
      const help = await ai(
        'Help someone with a cognitive disability fill in this form field. State exactly what information is needed and what format to use. Be brief and direct.',
        `Field: "${label.trim()}"\nForm context: ${ctx||'unknown'}\nType: ${active.type||active.tagName}\nPage: ${document.title}`
      );
      document.getElementById('lc-toast')?.remove();
      showPanel(`Help: ${label.trim()}`, help.split('\n').filter(Boolean).map(l=>`<div style="margin-bottom:5px">${esc(l)}</div>`).join(''));
    } catch (err) { document.getElementById('lc-toast')?.remove(); toast(err.message,'error'); }
  }

  // ─── READ ALOUD ──────────────────────────────────────────────────────────
  function getBestVoice() {
    const voices = speechSynth.getVoices();
    const preferred = ['Google UK English Female','Google UK English Male','Google US English','Microsoft Zira Desktop','Microsoft David Desktop','Samantha','Karen','Moira','Fiona'];
    for (const name of preferred) { const v = voices.find(v=>v.name===name); if (v) return v; }
    return voices.find(v=>v.lang.startsWith('en-')&&!v.default) || voices.find(v=>v.lang.startsWith('en')) || null;
  }

  function readAloud(speed) {
    const text = window.getSelection()?.toString().trim();
    if (!text) { toast('Select some text first.', 'warning'); return; }
    if (speechSynth.speaking) { speechSynth.cancel(); toast('Stopped.', 'info', 1500); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = speed || 1; utt.pitch = 1.0;
    const doSpeak = () => {
      const v = getBestVoice(); if (v) utt.voice = v;
      utt.onstart = () => toast('Reading — right-click to stop.', 'info', 4000);
      utt.onend   = () => toast('Done.', 'success', 2000);
      utt.onerror = () => toast('Speech error.', 'error');
      speechSynth.speak(utt);
    };
    speechSynth.getVoices().length ? doSpeak() : speechSynth.addEventListener('voiceschanged', doSpeak, { once:true });
  }

  // ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────
  const DEFAULT_SC_MAP = {
    D: 'dyslexiaFont', R: 'readingRuler',
    C: 'highContrast', O: 'pageOutline',
  };

  function getScMap() {
    const sc  = activeState?.shortcuts || {};
    const map = {};
    for (const [feat, letter] of Object.entries(sc)) { if (letter) map[letter.toUpperCase()] = feat; }
    return Object.keys(map).length ? map : DEFAULT_SC_MAP;
  }

  document.addEventListener('keydown', e => {
    if (!e.altKey || !e.shiftKey || e.metaKey || e.ctrlKey) return;
    const letter = e.key.toUpperCase();

    if (letter === 'S') { e.preventDefault(); summarizePage(); return; }
    if (letter === 'A') { e.preventDefault(); readAloud(activeState?.readSpeed || 1); return; }

    const scMap  = getScMap();
    const featKey = scMap[letter];
    if (!featKey || !activeState) return;
    e.preventDefault();

    activeState.toggles[featKey] = !activeState.toggles[featKey];

    // Save to storage — popup will pick up via onChanged listener
    chrome.storage.local.set({ [SK]: activeState });
    applyAll(activeState);

    const label = featKey.replace(/([A-Z])/g,' $1').trim();
    toast(`${label}: ${activeState.toggles[featKey] ? 'On' : 'Off'}`, 'info', 1500);
  }, { capture: false });

  // ─── Panel / toast helpers ────────────────────────────────────────────────
  function mkPanel(id, pos, title) {
    document.getElementById(id)?.remove();
    ensureAnim();
    const panel = document.createElement('div'); panel.id = id;
    Object.assign(panel.style, {
      position:'fixed', zIndex:'2147483641', overflowY:'auto',
      fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      color:'#e0e2f0', background:'rgba(12,14,21,0.97)',
      border:'1px solid rgba(108,143,255,.4)', borderRadius:'13px',
      boxShadow:'0 10px 40px rgba(0,0,0,.55)',
      animation:'_lc_in .22s ease', ...pos,
    });
    const hdr = document.createElement('div'); hdr.className='lc-phdr';
    Object.assign(hdr.style, { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px 9px', borderBottom:'1px solid rgba(108,143,255,.2)' });
    hdr.innerHTML = `<span style="font-size:12px;font-weight:700;color:#6c8fff;">${title}</span>`;
    panel.appendChild(hdr); return panel;
  }

  function showPanel(title, html) {
    const panel = mkPanel('lc-panel', { bottom:'20px', right:'20px', width:'310px', maxHeight:'55vh' }, title);
    panel.querySelector('.lc-phdr').appendChild(mkCloseBtn(() => panel.remove()));
    const body = document.createElement('div');
    applyThemeToEl(body);
    Object.assign(body.style, { padding:'12px 14px', fontSize:'13px', lineHeight:'1.7', overflowY:'auto' });
    body.innerHTML = html;
    panel.appendChild(body);
    document.body.appendChild(panel);
  }

  function applyThemeToEl(el) {
    if (!activeState) return;
    const t = activeState.toggles || {};
    if (t.dyslexiaFont) {
      const sp = {1:'0.04em',2:'0.09em',3:'0.14em'}[activeState.spacingIntensity]||'0.09em';
      el.style.fontFamily='Arial,Helvetica,sans-serif'; el.style.letterSpacing=sp; el.style.lineHeight='1.85';
    }
    if (t.largeText) el.style.fontSize=((activeState.fontSizeLevel/100)*13)+'px';
    if (t.highContrast) { el.style.color='#fff'; el.style.background='#0a0a0a'; }
  }

  function mkCloseBtn(fn) {
    const b = document.createElement('button');
    b.textContent = '✕';
    Object.assign(b.style, { background:'none',border:'none',color:'#7c85b0',cursor:'pointer',fontSize:'13px',padding:'0 2px',lineHeight:'1' });
    b.addEventListener('click', fn); return b;
  }

  function toast(msg, type='info', dur=3500) {
    document.getElementById('lc-toast')?.remove();
    const p = { info:{bg:'rgba(20,24,44,.97)',b:'#6c8fff'}, success:{bg:'rgba(15,35,25,.97)',b:'#4ade80'}, warning:{bg:'rgba(38,30,10,.97)',b:'#facc15'}, error:{bg:'rgba(38,12,12,.97)',b:'#f87171'} }[type];
    ensureAnim();
    const el = document.createElement('div'); el.id='lc-toast';
    Object.assign(el.style, {
      position:'fixed',bottom:'20px',right:'20px',background:p.bg,color:'#e8eaf6',
      border:`1px solid ${p.b}`,padding:'11px 16px',borderRadius:'11px',fontSize:'13px',
      fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',zIndex:'2147483647',
      maxWidth:'320px',lineHeight:'1.5',boxShadow:'0 6px 24px rgba(0,0,0,.4)',
      animation:'_lc_in .2s ease',pointerEvents:'none',
    });
    applyThemeToEl(el); el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.parentNode && el.remove(), dur);
  }

  function ensureAnim() {
    if (!document.getElementById('lc-anim')) injectStyle('lc-anim',`@keyframes _lc_in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`);
  }

  function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function injectStyle(id, css) { document.getElementById(id)?.remove(); const el=document.createElement('style'); el.id=id; el.textContent=css; (document.head||document.documentElement).appendChild(el); }
  function removeStyle(id) { document.getElementById(id)?.remove(); }

  // ─── Navigation reapply ───────────────────────────────────────────────────
  function startNavWatcher() {
    const onNav = () => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      if (!activeState) return;
      setTimeout(() => {
        const s2 = { ...activeState, toggles: { ...activeState.toggles, elementRemover: false } };
        applyAll(s2);
        if (activeState.toggles?.elementRemover) applyStoredRemovals();
      }, 400);
    };

    window.addEventListener('popstate',   onNav);
    window.addEventListener('hashchange', onNav);
    const oP=history.pushState.bind(history), oR=history.replaceState.bind(history);
    history.pushState    = (...a) => { oP(...a); setTimeout(onNav,200); };
    history.replaceState = (...a) => { oR(...a); setTimeout(onNav,200); };

    setInterval(() => {
      if (location.href !== lastHref) onNav();
      if (activeState?.toggles?.dyslexiaFont && !document.getElementById('lc-dyslexia')) applyAll(activeState);
    }, 2500);
  }

  // ─── Boot ────────────────────────────────────────────────────────────────
  chrome.storage.local.get([SK], ({ lc_state }) => {
    if (lc_state) {
      activeState = lc_state;
      customShortcuts = lc_state.shortcuts || {};
      applyAll(lc_state);
      if (lc_state.toggles?.elementRemover) applyStoredRemovals();
    }
    startNavWatcher();
  });

})();
