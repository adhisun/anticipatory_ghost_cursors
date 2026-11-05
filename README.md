# Ghost Cursors: Anticipatory Cross-Tab Agents

> A Chrome Extension (Manifest V3) that monitors task context in one tab and pre-configures actionable micro-UI with an animated, luminous ghost cursor in newly opened tabs to execute tasks instantly.

---

## 🌟 Key Features

- **Context Extraction**: Highlight text in any web application (e.g., an email, Jira ticket, or doc) and right-click **"👻 Send to Ghost Cursor"** to queue task or event intent.
- **Dual AI Parsing Engine**:
  - **Chrome Built-in AI**: Uses Gemini Nano via the Prompt API (`ai.languageModel`) when available.
  - **Heuristic NLP Fallback**: Fast, zero-dependency pattern extractor for dates, relative days (`tomorrow`, `Tuesday`), times, assignees/attendees, and tags.
- **Cross-Tab Anticipation**: When a target tab (e.g., Google Calendar, GitHub Issues, Jira, or bundled demo apps) is opened, Ghost Cursor detects the context and presents an ephemeral glassmorphic action card.
- **Animated Ghost Cursor**: A glowing SVG cursor glides across the form inputs, applying glowing focus pulse rings, filling the values, and optionally auto-submitting.
- **Dual Execution Safety**:
  - **⚡ Fill & Submit**: Populates fields and automatically triggers save/submit.
  - **✏️ Fill Only**: Populates fields and leaves the final review & submission to the user.
- **Interactive Extension Popup**: Shows real-time AI status, pending intents with 15-minute TTL countdown, a manual context simulator, and quick links to the demo suite.
- **Zero-Auth Demo Suite**: Includes bundled mock apps (`mock_email.html`, `mock_calendar.html`, `mock_tasks.html`) for instant, offline verification.

---

## 🚀 Getting Started

### 1. Load the Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** in the top right.
3. Click **Load unpacked** and select the `anticipatory_ghost_cursors` directory.

### 2. Run the Demo
1. Click the Ghost Cursors icon in the Chrome toolbar.
2. Click **"📨 Mock Email (Source)"** to open the sample inbox.
3. Highlight a task or meeting email and right-click **"👻 Send to Ghost Cursor"** (or click the quick-send button).
4. Click **"📅 Mock Calendar"** or **"📋 Mock Tasks"** to watch the ghost cursor glide and populate the form!

---

## 🧪 Testing

Run the automated test suite with Node.js:
```bash
npm test
```

---

## 📁 Project Structure

```
anticipatory_ghost_cursors/
├── manifest.json                  # Manifest V3 configuration
├── background/
│   ├── service_worker.js          # Context menus, storage queue, tab listeners
│   └── ai_parser.js               # Chrome Prompt API + Heuristic NLP engine
├── config/
│   └── domain_mappings.js         # Domain selectors & schemas
├── content/
│   ├── ghost_cursor.js            # Content script orchestrator
│   ├── dom_resolver.js            # Multi-strategy input resolution
│   └── ghost_ui.js                # Isolated Shadow DOM card & cursor animation
├── popup/
│   ├── popup.html                 # Extension popup dashboard
│   ├── popup.css
│   └── popup.js
├── demo/
│   ├── mock_email.html            # Tab A (Context source)
│   ├── mock_calendar.html         # Tab B (Calendar target)
│   ├── mock_tasks.html            # Tab B (Task tracker target)
│   └── demo_shared.css
├── icons/                         # 16, 48, 128 px icons
└── tests/
    └── test_parser.js             # Automated unit tests
```
