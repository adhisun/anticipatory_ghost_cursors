# Project Specification: Anticipatory Ghost Cursors (Cross-Tab Agents)

## 1. Project Overview
**Name:** Ghost Cursors
**Description:** A background agent that monitors context in one tab (e.g., an email with a task) and pre-configures actionable micro-UI in a newly opened tab (e.g., a project management tool) to execute that task instantly.
**Goal:** Eliminate copy-pasting and manual navigation for cross-application workflows using ephemeral UI.

## 2. Tech Stack & APIs
* **Architecture:** Chrome Extension (Manifest V3)
* **Languages:** JavaScript (ES6+), HTML, CSS
* **Core APIs:** Chrome Built-in AI Prompt API, `chrome.tabs`, `chrome.runtime.sendMessage`.

## 3. Core Features & User Flow
1. **Context Extraction:** User highlights text in Tab A (e.g., "Schedule meeting with John for Tuesday") and right-clicks to "Send to Ghost Cursor."
2. **Intent Parsing:** The background script uses local AI to extract the intent: `{"Action": "Schedule Meeting", "Target": "John", "Time": "Tuesday"}`.
3. **State Storage:** The background script holds this intent in memory.
4. **Tab Monitoring:** When the user opens Tab B (e.g., Google Calendar or a CRM), the extension recognizes the domain.
5. **UI Injection:** A content script in Tab B queries the background script, receives the pending intent, and uses a local AI prompt to map the intent to the current page's known structure.
6. **Execution Overlay:** A glowing button appears: "Schedule John for Tuesday?". Clicking it runs a script to fill the form inputs and click the "Save" button automatically.

## 4. Implementation Steps
* **Step 1: Context Menu:** Create a `chrome.contextMenus` item called "Extract Intent." Send the highlighted text to the background Service Worker.
* **Step 2: Intent Extraction:** In the Service Worker, prompt the AI: "Extract the action, entities, and parameters from this text as JSON." Store it in a global variable or `chrome.storage.session`.
* **Step 3: Domain Mapping:** Create a basic configuration file mapping domains (e.g., `calendar.google.com`) to generic CSS selectors (e.g., `#title_input`, `#save_btn`).
* **Step 4: Tab Listener:** Use `chrome.tabs.onUpdated` to detect when a supported domain finishes loading.
* **Step 5: Smart Injection:** Inject a content script into the new tab. The script compares the stored Intent JSON with the domain mapping, injects an ephemeral UI prompt at the top of the page, and wires up the click event to populate the matched selectors.

## 5. Constraints
* **Brittle Selectors:** Websites update their DOM constantly. A robust version of this requires the AI to actually read the DOM and find the inputs semantically rather than relying on hardcoded selectors, but this increases latency.
* **Authentication:** The agent assumes the user is already logged into the target application in the new tab. It cannot handle auth flows.