/**
 * Domain Mappings Configuration for Ghost Cursors
 * Maps site URLs / domains to form field CSS selectors and supported action types.
 */

const DOMAIN_MAPPINGS = [
  // 1. Bundled Demo Calendar
  {
    id: 'demo-calendar',
    name: 'Demo Calendar',
    urlPattern: /mock_calendar\.html/i,
    actionType: 'meeting',
    fields: {
      title: '#event-title',
      date: '#event-date',
      time: '#event-time',
      attendee: '#event-attendee',
      description: '#event-description'
    },
    submitSelector: '#btn-save-event',
    containerSelector: '#calendar-form-card'
  },

  // 2. Bundled Demo Tasks / Project Management
  {
    id: 'demo-tasks',
    name: 'Demo Task Tracker',
    urlPattern: /mock_tasks\.html/i,
    actionType: 'task',
    fields: {
      title: '#task-title',
      assignee: '#task-assignee',
      date: '#task-due-date',
      description: '#task-description'
    },
    submitSelector: '#btn-create-task',
    containerSelector: '#task-form-card'
  },

  // 3. Google Calendar
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    urlPattern: /calendar\.google\.com/i,
    actionType: 'meeting',
    fields: {
      title: 'input[aria-label="Add title and time"], input[aria-label*="Add title"], input[placeholder*="Add title"]',
      date: 'input[aria-label*="Start date"], input[data-key="startDate"]',
      time: 'input[aria-label*="Start time"], input[data-key="startTime"]',
      attendee: 'input[aria-label*="Add guests"], input[placeholder*="Add guests"]',
      description: 'div[aria-label*="Add description"], textarea[aria-label*="description"]'
    },
    submitSelector: 'button[aria-label*="Save"], #xSaveBu',
    containerSelector: 'div[role="dialog"]'
  },

  // 4. GitHub Issue Creation
  {
    id: 'github-issues',
    name: 'GitHub Issues',
    urlPattern: /github\.com\/.*\/issues\/new/i,
    actionType: 'task',
    fields: {
      title: '#issue_title, input[name="issue[title]"]',
      description: '#issue_body, textarea[name="issue[body]"]'
    },
    submitSelector: 'button.btn-primary[type="submit"], button[data-hotkey="Control+Enter,Meta+Enter"]',
    containerSelector: '#new_issue'
  },

  // 5. Generic Jira / Atlassian Issue Creation
  {
    id: 'jira-issues',
    name: 'Jira Software',
    urlPattern: /(?:atlassian\.net|jira)/i,
    actionType: 'task',
    fields: {
      title: 'input[name="summary"], #summary',
      description: 'textarea[name="description"], #description',
      assignee: '#assignee-field, input[name="assignee"]'
    },
    submitSelector: '#create-issue-submit, button[type="submit"]',
    containerSelector: '#create-issue-dialog'
  }
];

// Attach to global scope for browser content script and Node environments
if (typeof globalThis !== 'undefined') {
  globalThis.GHOST_DOMAIN_MAPPINGS = DOMAIN_MAPPINGS;
}
if (typeof window !== 'undefined') {
  window.GHOST_DOMAIN_MAPPINGS = DOMAIN_MAPPINGS;
}
