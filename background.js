// Lucid – Background Service Worker

const STORAGE_KEY = 'lc_state';

function getState() {
  return new Promise(r => chrome.storage.local.get([STORAGE_KEY], d => r(d[STORAGE_KEY] || {})));
}

function registerContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'lc-sel',       title: 'Lucid',                       contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'lc-simplify',  parentId: 'lc-sel', title: 'Simplify this text',         contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'lc-explain',   parentId: 'lc-sel', title: 'Explain this',               contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'lc-translate', parentId: 'lc-sel', title: 'Translate to plain English',  contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'lc-readaloud', parentId: 'lc-sel', title: 'Read aloud',                 contexts: ['selection'] });

    chrome.contextMenus.create({ id: 'lc-page',      title: 'Lucid',                       contexts: ['page'] });
    chrome.contextMenus.create({ id: 'lc-summarize', parentId: 'lc-page', title: 'Summarize this page',       contexts: ['page'] });

    chrome.contextMenus.create({ id: 'lc-img',       title: 'Lucid',                       contexts: ['image'] });
    chrome.contextMenus.create({ id: 'lc-descimg',   parentId: 'lc-img',  title: 'Describe this image',       contexts: ['image'] });

    chrome.contextMenus.create({ id: 'lc-edit',      title: 'Lucid',                       contexts: ['editable'] });
    chrome.contextMenus.create({ id: 'lc-formhelp',  parentId: 'lc-edit', title: 'Help me fill this field',   contexts: ['editable'] });
  });
}

chrome.runtime.onInstalled.addListener(d => {
  registerContextMenus();
  if (d.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
});
chrome.runtime.onStartup.addListener(registerContextMenus);

// ─── Push state to tab when user switches to it ────────────────────────────────
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const state = await getState();
  if (!state.toggles || !Object.values(state.toggles).some(Boolean)) return;

  // Try to send immediately; if content script isn't ready, inject then retry
  chrome.tabs.sendMessage(tabId, { type: 'APPLY_STATE', state }, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript(
        { target: { tabId }, files: ['content.js'] },
        () => {
          if (chrome.runtime.lastError) return;
          setTimeout(() => chrome.tabs.sendMessage(tabId, { type: 'APPLY_STATE', state }), 200);
        }
      );
    }
  });
});

// ─── Context menu clicks ──────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  const send = msg => chrome.tabs.sendMessage(tab.id, msg);

  switch (info.menuItemId) {
    case 'lc-simplify':  getState().then(s => send({ type: 'AI_SEL', mode: 'simplify',  level: s.readingLevel || 'simple' })); break;
    case 'lc-explain':   send({ type: 'AI_SEL', mode: 'explain'   }); break;
    case 'lc-translate': send({ type: 'AI_SEL', mode: 'translate' }); break;
    case 'lc-readaloud': getState().then(s => send({ type: 'READ_ALOUD', speed: s.readSpeed || 1 })); break;
    case 'lc-summarize': send({ type: 'SUMMARIZE_PAGE' }); break;
    case 'lc-descimg':   send({ type: 'DESCRIBE_IMAGE', srcUrl: info.srcUrl }); break;
    case 'lc-formhelp':  send({ type: 'FORM_HELP' }); break;
  }
});
