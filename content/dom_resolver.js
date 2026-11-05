/**
 * Multi-Strategy DOM Resolver for Ghost Cursors
 * Finds form inputs via primary CSS selectors or semantic attribute fallbacks.
 */

(function (global) {
  'use strict';

  function resolveFormElements(domainConfig, intent) {
    const resolved = [];

    // Helper to evaluate value to fill based on intent
    const intentValues = {
      title: intent.title || '',
      date: intent.computedDate || intent.date || '',
      time: intent.time || '',
      attendee: intent.person || '',
      assignee: intent.person || '',
      description: intent.description || ''
    };

    const fieldsToResolve = ['title', 'date', 'time', 'attendee', 'assignee', 'description'];

    fieldsToResolve.forEach(fieldKey => {
      const val = intentValues[fieldKey];
      if (!val) return;

      let el = null;

      // Strategy 1: Configured domain selector
      if (domainConfig?.fields?.[fieldKey]) {
        el = document.querySelector(domainConfig.fields[fieldKey]);
      }

      // Strategy 2: Semantic attribute fallback
      if (!el || !isElementVisible(el)) {
        el = findInputSemantically(fieldKey);
      }

      if (el && isElementVisible(el)) {
        resolved.push({
          fieldKey,
          element: el,
          value: val
        });
      }
    });

    // Resolve Submit Button
    let submitBtn = null;
    if (domainConfig?.submitSelector) {
      submitBtn = document.querySelector(domainConfig.submitSelector);
    }
    if (!submitBtn || !isElementVisible(submitBtn)) {
      submitBtn = findSubmitButtonSemantically();
    }

    return {
      fields: resolved,
      submitButton: submitBtn
    };
  }

  function findInputSemantically(fieldKey) {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));

    const searchTokens = {
      title: ['title', 'summary', 'subject', 'name', 'topic', 'event-title', 'task-title'],
      date: ['date', 'due', 'when', 'day', 'event-date', 'task-due'],
      time: ['time', 'start-time', 'hour'],
      attendee: ['attendee', 'guest', 'invite', 'who', 'participant'],
      assignee: ['assignee', 'assign', 'owner', 'member'],
      description: ['description', 'body', 'details', 'notes', 'comment']
    }[fieldKey] || [fieldKey];

    // Priority check: HTML5 input type matching
    if (fieldKey === 'date') {
      const dateTypeInput = inputs.find(i => i.type === 'date' && isElementVisible(i));
      if (dateTypeInput) return dateTypeInput;
    }
    if (fieldKey === 'time') {
      const timeTypeInput = inputs.find(i => i.type === 'time' && isElementVisible(i));
      if (timeTypeInput) return timeTypeInput;
    }

    for (const input of inputs) {
      if (!isElementVisible(input)) continue;

      const id = (input.id || '').toLowerCase();
      const name = (input.name || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();

      // Check associated label
      let labelText = '';
      if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) labelText = label.textContent.toLowerCase();
      }

      const combinedAttrs = `${id} ${name} ${placeholder} ${ariaLabel} ${labelText}`;

      for (const token of searchTokens) {
        if (combinedAttrs.includes(token)) {
          return input;
        }
      }
    }

    return null;
  }

  function findSubmitButtonSemantically() {
    const candidates = Array.from(document.querySelectorAll('button, input[type="submit"], [role="button"]'));
    const submitWords = ['save', 'submit', 'create', 'schedule', 'add event', 'add task'];

    for (const btn of candidates) {
      if (!isElementVisible(btn)) continue;
      const text = (btn.textContent || btn.value || btn.getAttribute('aria-label') || '').toLowerCase().trim();
      if (submitWords.some(word => text.includes(word))) {
        return btn;
      }
    }
    return null;
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function fillElementValue(element, value) {
    if (!element) return;

    element.focus();

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      // Trigger native setter to support React / controlled components
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window[element.tagName === 'INPUT' ? 'HTMLInputElement' : 'HTMLTextAreaElement'].prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(element, value);
      } else {
        element.value = value;
      }

      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    } else if (element.tagName === 'SELECT') {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    } else if (element.isContentEditable) {
      element.innerText = value;
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }

    element.blur();
  }

  global.GhostDomResolver = {
    resolveFormElements,
    fillElementValue,
    isElementVisible
  };
})(typeof window !== 'undefined' ? window : globalThis);
