/**
 * Content Script Orchestrator for Ghost Cursors
 * Queries pending intents, resolves DOM mappings, and triggers Ghost UI overlays.
 */

(function () {
  'use strict';

  const mappings = window.GHOST_DOMAIN_MAPPINGS || [];
  let isExecuting = false;
  let activeIntent = null;

  function getCurrentDomainConfig() {
    const currentUrl = window.location.href;
    for (const mapping of mappings) {
      if (mapping.urlPattern.test(currentUrl)) {
        return mapping;
      }
    }
    return null;
  }

  async function checkAndInjectOverlay() {
    if (isExecuting) return;

    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PENDING_INTENTS' });
      if (!response?.success || !response.intents?.length) {
        return;
      }

      const domainConfig = getCurrentDomainConfig();
      const intents = response.intents;

      // Find best intent match for this page
      let targetIntent = null;
      if (domainConfig) {
        targetIntent = intents.find(i => i.actionType === domainConfig.actionType) || intents[0];
      } else {
        // Generic page with inputs
        targetIntent = intents[0];
      }

      if (!targetIntent) return;

      const resolution = window.GhostDomResolver.resolveFormElements(domainConfig, targetIntent);
      if (resolution.fields && resolution.fields.length > 0) {
        activeIntent = targetIntent;
        presentGhostCard(domainConfig, targetIntent, resolution);
      }
    } catch (err) {
      // Content script might run on pages without extension context permissions
    }
  }

  function presentGhostCard(domainConfig, intent, resolution) {
    window.GhostUI.renderCard(intent, {
      onFillAndSubmit: async () => {
        if (isExecuting) return;
        isExecuting = true;
        // Re-resolve in case DOM elements shifted
        const currentResolution = window.GhostDomResolver.resolveFormElements(domainConfig, intent);
        await window.GhostUI.animateExecutionSequence(
          currentResolution.fields,
          currentResolution.submitButton,
          true,
          () => {
            isExecuting = false;
            chrome.runtime.sendMessage({ type: 'INTENT_EXECUTED', intentId: intent.id });
          }
        );
      },
      onFillOnly: async () => {
        if (isExecuting) return;
        isExecuting = true;
        const currentResolution = window.GhostDomResolver.resolveFormElements(domainConfig, intent);
        await window.GhostUI.animateExecutionSequence(
          currentResolution.fields,
          null,
          false,
          () => {
            isExecuting = false;
            chrome.runtime.sendMessage({ type: 'INTENT_EXECUTED', intentId: intent.id });
          }
        );
      },
      onDismiss: () => {
        chrome.runtime.sendMessage({ type: 'INTENT_EXECUTED', intentId: intent.id });
      }
    });
  }

  // Bridge for demo pages to send intents via postMessage
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'GHOST_QUICK_SEND' && event.data?.text) {
      chrome.runtime.sendMessage({ type: 'STORE_RAW_TEXT', text: event.data.text }, () => {
        window.postMessage({ type: 'GHOST_QUICK_SEND_SUCCESS', originalText: event.data.text }, '*');
      });
    }
  });

  // Listen for proactive background notifications
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'CHECK_FOR_GHOST_OVERLAY' || message.type === 'INTENT_EXTRACTED') {
      setTimeout(checkAndInjectOverlay, 300);
    }
  });

  // Watch for dynamic modal / dialog creation (e.g. Google Calendar event creation popup)
  const observer = new MutationObserver((mutations) => {
    if (isExecuting) return;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        // Skip mutations caused by the ghost cursor host itself
        const isSelfMutation = Array.from(m.addedNodes).some(n => n.id === 'ghost-cursor-host' || (n.nodeType === 1 && n.closest && n.closest('#ghost-cursor-host')));
        if (isSelfMutation) continue;

        // Debounce check
        clearTimeout(window.__ghostDebounceTimer);
        window.__ghostDebounceTimer = setTimeout(checkAndInjectOverlay, 500);
        break;
      }
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  // Initial check on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(checkAndInjectOverlay, 500));
  } else {
    setTimeout(checkAndInjectOverlay, 500);
  }
})();
