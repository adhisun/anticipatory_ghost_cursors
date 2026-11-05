/**
 * Ghost UI Component for Ghost Cursors
 * Renders an isolated Shadow DOM containing the glassmorphic action card,
 * field highlight pulse rings, and the animated luminous ghost cursor.
 */

(function (global) {
  'use strict';

  class GhostUI {
    constructor() {
      this.host = null;
      this.shadowRoot = null;
      this.cardEl = null;
      this.cursorEl = null;
      this.pulseRingEl = null;
    }

    init() {
      if (this.host && document.body.contains(this.host)) return;

      this.host = document.createElement('div');
      this.host.id = 'ghost-cursor-host';
      this.host.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 0; z-index: 2147483647; pointer-events: none;';
      
      this.shadowRoot = this.host.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = this.getStyles();

      document.body.appendChild(this.host);
    }

    getStyles() {
      return `
        <style>
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }

          /* Floating Glassmorphic Action Card */
          .ghost-card {
            pointer-events: auto;
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 380px;
            background: rgba(17, 24, 39, 0.88);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(99, 102, 241, 0.4);
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 25px rgba(99, 102, 241, 0.25);
            border-radius: 16px;
            color: #f3f4f6;
            padding: 18px 20px;
            z-index: 2147483647;
            transform: translateY(100px) scale(0.95);
            opacity: 0;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .ghost-card.visible {
            transform: translateY(0) scale(1);
            opacity: 1;
          }

          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }

          .brand-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #818cf8;
            background: rgba(99, 102, 241, 0.15);
            padding: 4px 10px;
            border-radius: 20px;
            border: 1px solid rgba(99, 102, 241, 0.3);
          }

          .btn-close {
            background: transparent;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 16px;
            padding: 4px 6px;
            border-radius: 6px;
            line-height: 1;
            transition: color 0.15s, background 0.15s;
          }
          .btn-close:hover {
            color: #f3f4f6;
            background: rgba(255, 255, 255, 0.1);
          }

          .card-title {
            font-size: 15px;
            font-weight: 600;
            line-height: 1.4;
            color: #ffffff;
            margin-bottom: 10px;
          }

          .entity-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 16px;
          }

          .badge {
            font-size: 12px;
            padding: 3px 8px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.08);
            color: #e5e7eb;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .badge.highlight {
            background: rgba(59, 130, 246, 0.2);
            color: #93c5fd;
            border: 1px solid rgba(59, 130, 246, 0.3);
          }

          .card-actions {
            display: flex;
            gap: 10px;
          }

          .btn-primary {
            flex: 1.3;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #ffffff;
            border: none;
            padding: 9px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          }
          .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
          }
          .btn-primary:active {
            transform: translateY(0);
          }

          .btn-secondary {
            flex: 1;
            background: rgba(255, 255, 255, 0.08);
            color: #e5e7eb;
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 9px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            transition: background 0.15s, border-color 0.15s;
          }
          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.14);
            border-color: rgba(255, 255, 255, 0.3);
          }

          /* Animated Luminous Ghost Cursor */
          .ghost-cursor {
            position: fixed;
            pointer-events: none;
            z-index: 2147483647;
            width: 36px;
            height: 36px;
            top: 0;
            left: 0;
            opacity: 0;
            transform: translate3d(0, 0, 0);
            transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
            filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.8)) drop-shadow(0 0 20px rgba(129, 140, 248, 0.5));
          }

          .ghost-cursor.visible {
            opacity: 1;
          }

          .ghost-cursor svg {
            width: 100%;
            height: 100%;
          }

          /* Target Field Highlight Ring */
          .field-pulse-ring {
            position: fixed;
            pointer-events: none;
            border-radius: 8px;
            border: 2px solid #818cf8;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.6), inset 0 0 10px rgba(99, 102, 241, 0.2);
            transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
            opacity: 0;
            z-index: 2147483646;
          }
          .field-pulse-ring.active {
            opacity: 1;
            transform: scale(1.02);
          }

          /* Shockwave Ripple for Clicks */
          .click-ripple {
            position: fixed;
            pointer-events: none;
            border-radius: 50%;
            border: 2px solid #6366f1;
            background: rgba(99, 102, 241, 0.3);
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 1;
            animation: ripple-expand 0.4s ease-out forwards;
            z-index: 2147483647;
          }

          @keyframes ripple-expand {
            to {
              transform: translate(-50%, -50%) scale(2.2);
              opacity: 0;
            }
          }
        </style>
      `;
    }

    renderCard(intent, { onFillAndSubmit, onFillOnly, onDismiss }) {
      this.init();

      if (this.cardEl) {
        this.cardEl.remove();
      }

      this.cardEl = document.createElement('div');
      this.cardEl.className = 'ghost-card';

      const typeLabel = intent.actionType === 'meeting' ? 'Calendar Event' : 'Task / Action';
      const typeIcon = intent.actionType === 'meeting' ? '📅' : '⚡';

      const badges = [];
      if (intent.person) badges.push(`<span class="badge highlight">👤 ${escapeHtml(intent.person)}</span>`);
      if (intent.date) badges.push(`<span class="badge highlight">🗓️ ${escapeHtml(intent.date)}</span>`);
      if (intent.time) badges.push(`<span class="badge highlight">⏰ ${escapeHtml(intent.time)}</span>`);
      if (intent.tags && intent.tags.length) {
        intent.tags.forEach(t => badges.push(`<span class="badge">🏷️ ${escapeHtml(t)}</span>`));
      }

      this.cardEl.innerHTML = `
        <div class="card-header">
          <div class="brand-badge">
            <span>👻</span>
            <span>Ghost Cursor Anticipation</span>
          </div>
          <button class="btn-close" title="Dismiss">✕</button>
        </div>
        <div class="card-title">${escapeHtml(intent.title || 'Task Detected')}</div>
        <div class="entity-badges">
          ${badges.join('')}
        </div>
        <div class="card-actions">
          <button class="btn-primary" id="btn-fill-submit">
            <span>⚡</span>
            <span>Fill & Submit</span>
          </button>
          <button class="btn-secondary" id="btn-fill-only">
            <span>✏️</span>
            <span>Fill Only</span>
          </button>
        </div>
      `;

      this.shadowRoot.appendChild(this.cardEl);

      // Trigger enter animation
      requestAnimationFrame(() => {
        this.cardEl.classList.add('visible');
      });

      // Bind actions
      this.cardEl.querySelector('.btn-close').addEventListener('click', () => {
        this.hideCard();
        onDismiss?.();
      });

      this.cardEl.querySelector('#btn-fill-submit').addEventListener('click', () => {
        onFillAndSubmit?.();
      });

      this.cardEl.querySelector('#btn-fill-only').addEventListener('click', () => {
        onFillOnly?.();
      });
    }

    hideCard() {
      if (this.cardEl) {
        this.cardEl.classList.remove('visible');
        setTimeout(() => {
          if (this.cardEl) {
            this.cardEl.remove();
            this.cardEl = null;
          }
        }, 350);
      }
    }

    createCursorIfNeeded() {
      if (this.cursorEl) return;

      this.cursorEl = document.createElement('div');
      this.cursorEl.className = 'ghost-cursor';
      this.cursorEl.innerHTML = `
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3L25 15L15 17L11 27L6 3Z" fill="#818cf8" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="15" cy="15" r="4" fill="#6366f1" opacity="0.8"/>
        </svg>
      `;

      this.pulseRingEl = document.createElement('div');
      this.pulseRingEl.className = 'field-pulse-ring';

      this.shadowRoot.appendChild(this.pulseRingEl);
      this.shadowRoot.appendChild(this.cursorEl);
    }

    async animateExecutionSequence(resolvedFields, submitButton, isSubmit, onComplete) {
      this.createCursorIfNeeded();

      // Start cursor position from the action card
      if (this.cardEl) {
        const cardRect = this.cardEl.getBoundingClientRect();
        this.setCursorPos(cardRect.left + 80, cardRect.top + 40);
        this.cursorEl.classList.add('visible');
      } else {
        this.setCursorPos(window.innerWidth / 2, window.innerHeight / 2);
        this.cursorEl.classList.add('visible');
      }

      await sleep(200);

      // Iterate and glide through each field
      for (const item of resolvedFields) {
        const rect = item.element.getBoundingClientRect();
        // Scroll into view if needed
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(250);
        }

        const updatedRect = item.element.getBoundingClientRect();
        const targetX = updatedRect.left + Math.min(30, updatedRect.width / 4);
        const targetY = updatedRect.top + updatedRect.height / 2;

        // Move cursor to field
        this.setCursorPos(targetX, targetY);
        this.highlightField(updatedRect);

        await sleep(350);

        // Fill value
        global.GhostDomResolver.fillElementValue(item.element, item.value);
        this.triggerClickRipple(targetX, targetY);

        await sleep(250);
      }

      // If submitting, glide to the submit button
      if (isSubmit && submitButton && global.GhostDomResolver.isElementVisible(submitButton)) {
        const btnRect = submitButton.getBoundingClientRect();
        if (btnRect.top < 0 || btnRect.bottom > window.innerHeight) {
          submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(250);
        }

        const updatedBtnRect = submitButton.getBoundingClientRect();
        const btnX = updatedBtnRect.left + updatedBtnRect.width / 2;
        const btnY = updatedBtnRect.top + updatedBtnRect.height / 2;

        this.setCursorPos(btnX, btnY);
        this.highlightField(updatedBtnRect);
        await sleep(400);

        this.triggerClickRipple(btnX, btnY);
        await sleep(150);

        submitButton.click();
      }

      this.clearHighlight();
      await sleep(300);

      // Fade out cursor
      if (this.cursorEl) {
        this.cursorEl.classList.remove('visible');
      }

      this.hideCard();
      onComplete?.();
    }

    setCursorPos(x, y) {
      if (this.cursorEl) {
        this.cursorEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    }

    highlightField(rect) {
      if (!this.pulseRingEl) return;
      this.pulseRingEl.style.left = `${rect.left - 4}px`;
      this.pulseRingEl.style.top = `${rect.top - 4}px`;
      this.pulseRingEl.style.width = `${rect.width + 8}px`;
      this.pulseRingEl.style.height = `${rect.height + 8}px`;
      this.pulseRingEl.classList.add('active');
    }

    clearHighlight() {
      if (this.pulseRingEl) {
        this.pulseRingEl.classList.remove('active');
      }
    }

    triggerClickRipple(x, y) {
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '30px';
      ripple.style.height = '30px';
      this.shadowRoot.appendChild(ripple);
      setTimeout(() => ripple.remove(), 400);
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.GhostUI = new GhostUI();
})(typeof window !== 'undefined' ? window : globalThis);
