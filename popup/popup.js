/**
 * Popup Script for Ghost Cursors
 * Renders active intents, checks AI availability, and triggers quick context extraction.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('ai-status');
  const countEl = document.getElementById('intent-count');
  const containerEl = document.getElementById('intents-container');
  const btnClearAll = document.getElementById('btn-clear-all');
  const testTextEl = document.getElementById('test-text');
  const btnSimulate = document.getElementById('btn-simulate');

  const btnOpenEmail = document.getElementById('btn-open-email');
  const btnOpenCalendar = document.getElementById('btn-open-calendar');
  const btnOpenTasks = document.getElementById('btn-open-tasks');

  // 1. Fetch & Display AI Status
  chrome.runtime.sendMessage({ type: 'GET_AI_STATUS' }, (res) => {
    if (res?.status?.available) {
      statusEl.textContent = '⚡ Gemini Nano Ready';
      statusEl.classList.add('active-nano');
    } else {
      statusEl.textContent = '⚡ Local Heuristic AI';
    }
  });

  // 2. Fetch & Render Pending Intents
  async function refreshIntents() {
    chrome.runtime.sendMessage({ type: 'GET_PENDING_INTENTS' }, (res) => {
      const intents = res?.intents || [];
      countEl.textContent = intents.length;
      btnClearAll.style.display = intents.length > 0 ? 'inline-block' : 'none';

      if (intents.length === 0) {
        containerEl.innerHTML = `
          <div class="empty-state">
            No pending intents.<br>Highlight text in any tab &amp; right-click <strong>"Send to Ghost Cursor"</strong>, or use the simulator below.
          </div>
        `;
        return;
      }

      containerEl.innerHTML = intents.map(item => {
        const remainingMinutes = Math.max(1, Math.round((15 * 60 * 1000 - (Date.now() - item.timestamp)) / 60000));
        const metaChips = [];
        if (item.person) metaChips.push(`👤 ${escapeHtml(item.person)}`);
        if (item.date) metaChips.push(`🗓️ ${escapeHtml(item.date)}`);
        if (item.time) metaChips.push(`⏰ ${escapeHtml(item.time)}`);

        return `
          <div class="intent-card" data-id="${item.id}">
            <button class="btn-card-delete" title="Dismiss intent">✕</button>
            <div class="intent-card-header">
              <span class="type-pill ${item.actionType}">${item.actionType}</span>
              <span class="ttl-text">Expires in ${remainingMinutes}m</span>
            </div>
            <div class="intent-card-title">${escapeHtml(item.title || item.sourceText)}</div>
            <div class="intent-card-meta">
              ${metaChips.map(c => `<span class="meta-chip">${c}</span>`).join('')}
            </div>
          </div>
        `;
      }).join('');

      // Attach delete handlers
      containerEl.querySelectorAll('.btn-card-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const card = e.target.closest('.intent-card');
          const id = card.getAttribute('data-id');
          chrome.runtime.sendMessage({ type: 'INTENT_EXECUTED', intentId: id }, () => {
            refreshIntents();
          });
        });
      });
    });
  }

  refreshIntents();

  // 3. Clear All Button
  btnClearAll.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_INTENTS' }, () => {
      refreshIntents();
    });
  });

  // 4. Quick Context Simulator Button
  btnSimulate.addEventListener('click', () => {
    const text = testTextEl.value.trim();
    if (!text) return;

    btnSimulate.textContent = 'Parsing...';
    btnSimulate.disabled = true;

    chrome.runtime.sendMessage({ type: 'STORE_RAW_TEXT', text }, (res) => {
      btnSimulate.textContent = 'Extract Intent';
      btnSimulate.disabled = false;
      testTextEl.value = '';
      refreshIntents();
    });
  });

  // 5. Open Demo Pages
  btnOpenEmail.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('demo/mock_email.html') });
  });

  btnOpenCalendar.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('demo/mock_calendar.html') });
  });

  btnOpenTasks.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('demo/mock_tasks.html') });
  });
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
