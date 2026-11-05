/**
 * Service Worker for Ghost Cursors
 * Handles context menus, AI parsing, intent session storage, tab events, and messaging.
 */

import { parseIntent, checkAiAvailability } from './ai_parser.js';

const INTENTS_STORAGE_KEY = 'ghost_intents';
const INTENT_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

// 1. Extension Lifecycle & Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send-to-ghost-cursor',
    title: '👻 Send to Ghost Cursor',
    contexts: ['selection']
  });
  console.log('[Ghost Cursors] Service worker initialized and context menu registered.');
});

// 2. Handle Context Menu Click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'send-to-ghost-cursor' && info.selectionText) {
    try {
      const intent = await parseIntent(info.selectionText);
      if (intent) {
        await storeIntent(intent);
        updateBadge(1);
        // Optionally notify the active tab or broadcast
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'INTENT_EXTRACTED',
            intent
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[Ghost Cursors] Error processing highlighted text:', err);
    }
  }
});

// 3. Storage & Queue Helpers
async function getActiveIntents() {
  const result = await chrome.storage.session.get(INTENTS_STORAGE_KEY);
  const intents = result[INTENTS_STORAGE_KEY] || [];
  const now = Date.now();
  // Filter unexpired intents
  const valid = intents.filter(item => (now - item.timestamp) < INTENT_TTL_MS);
  if (valid.length !== intents.length) {
    await chrome.storage.session.set({ [INTENTS_STORAGE_KEY]: valid });
  }
  return valid;
}

async function storeIntent(intent) {
  const valid = await getActiveIntents();
  const intentWithId = {
    ...intent,
    id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  };
  // Place newest at the front
  valid.unshift(intentWithId);
  await chrome.storage.session.set({ [INTENTS_STORAGE_KEY]: valid });
  updateBadge(valid.length);
  return intentWithId;
}

async function removeIntent(intentId) {
  const valid = await getActiveIntents();
  const updated = valid.filter(item => item.id !== intentId);
  await chrome.storage.session.set({ [INTENTS_STORAGE_KEY]: updated });
  updateBadge(updated.length);
  return updated;
}

async function clearAllIntents() {
  await chrome.storage.session.set({ [INTENTS_STORAGE_KEY]: [] });
  updateBadge(0);
}

function updateBadge(count) {
  try {
    if (count > 0) {
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#6366f1' }); // Indigo
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (e) {
    // Ignore badge errors if action is not loaded
  }
}

// 4. Runtime Messaging Bridge
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PENDING_INTENTS') {
    getActiveIntents().then(intents => sendResponse({ success: true, intents }));
    return true; // async sendResponse
  }

  if (message.type === 'STORE_RAW_TEXT') {
    parseIntent(message.text)
      .then(intent => storeIntent(intent))
      .then(stored => sendResponse({ success: true, intent: stored }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'INTENT_EXECUTED') {
    removeIntent(message.intentId).then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === 'CLEAR_INTENTS') {
    clearAllIntents().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === 'GET_AI_STATUS') {
    checkAiAvailability().then(status => sendResponse({ success: true, status }));
    return true;
  }
});

// 5. Tab update monitor (anticipatory readiness)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab?.url) {
    const intents = await getActiveIntents();
    if (intents.length > 0) {
      // Notify tab that pending intents are waiting
      chrome.tabs.sendMessage(tabId, {
        type: 'CHECK_FOR_GHOST_OVERLAY',
        intents
      }).catch(() => {
        // Tab might not be a matching page or content script not ready
      });
    }
  }
});
