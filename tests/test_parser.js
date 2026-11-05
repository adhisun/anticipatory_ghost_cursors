/**
 * Automated Test Suite for Ghost Cursors Parser & Domain Mappings
 * Run with: node tests/test_parser.js
 */

import { parseWithHeuristics } from '../background/ai_parser.js';
import '../config/domain_mappings.js';

const DOMAIN_MAPPINGS = globalThis.GHOST_DOMAIN_MAPPINGS;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== Running Ghost Cursors Automated Test Suite ===\n');

// 1. Test Meeting Extraction: 1-on-1 sync
console.log('Test 1: Schedule 1-on-1 Meeting Intent');
const email1 = 'Hi team, please schedule a 1-on-1 sync with Sarah for tomorrow at 2:00 PM to review Q3 goals.';
const res1 = parseWithHeuristics(email1);
assert(res1.actionType === 'meeting', `Action type is 'meeting' (got '${res1.actionType}')`);
assert(res1.person === 'Sarah', `Person extracted as 'Sarah' (got '${res1.person}')`);
assert(res1.time.toLowerCase().includes('2:00 pm'), `Time contains '2:00 PM' (got '${res1.time}')`);
assert(res1.date === 'Tomorrow', `Date extracted as 'Tomorrow' (got '${res1.date}')`);
assert(res1.computedDate.length === 10, `Computed date resolved to YYYY-MM-DD (got '${res1.computedDate}')`);
assert(res1.title.includes('Sarah'), `Title contains person name (got '${res1.title}')`);

// 2. Test Meeting Extraction: Coffee Chat with relative day
console.log('\nTest 2: Coffee Chat on Specific Day Intent');
const email2 = 'Hey, let\'s grab a coffee chat with David on Tuesday at 10:30 AM to discuss new project ideas.';
const res2 = parseWithHeuristics(email2);
assert(res2.actionType === 'meeting', `Action type is 'meeting' (got '${res2.actionType}')`);
assert(res2.person === 'David', `Person extracted as 'David' (got '${res2.person}')`);
assert(res2.date === 'Tuesday', `Date extracted as 'Tuesday' (got '${res2.date}')`);
assert(res2.time.toLowerCase().includes('10:30 am'), `Time contains '10:30 AM' (got '${res2.time}')`);
assert(res2.computedDate.length === 10, `Computed date resolved to YYYY-MM-DD (got '${res2.computedDate}')`);

// 3. Test Task Extraction: Bug report
console.log('\nTest 3: Bug Report / Task Assignment Intent');
const email3 = 'Urgent bug: Fix checkout button double-click issue assigned to Alex due Friday.';
const res3 = parseWithHeuristics(email3);
assert(res3.actionType === 'task', `Action type is 'task' (got '${res3.actionType}')`);
assert(res3.person === 'Alex', `Person extracted as 'Alex' (got '${res3.person}')`);
assert(res3.date === 'Friday', `Date extracted as 'Friday' (got '${res3.date}')`);
assert(res3.tags.includes('Bug') || res3.tags.includes('Urgent'), `Tags include 'Bug' or 'Urgent' (got [${res3.tags.join(', ')}])`);
assert(res3.title.toLowerCase().includes('fix checkout button'), `Title contains task summary (got '${res3.title}')`);

// 4. Test Domain Mappings Integrity
console.log('\nTest 4: Domain Mappings Configuration Integrity');
assert(Array.isArray(DOMAIN_MAPPINGS) && DOMAIN_MAPPINGS.length >= 4, `At least 4 domain mappings registered (count: ${DOMAIN_MAPPINGS.length})`);

const demoCal = DOMAIN_MAPPINGS.find(m => m.id === 'demo-calendar');
assert(demoCal && demoCal.fields.title === '#event-title', 'Demo calendar mapping has valid title selector');
assert(demoCal && demoCal.submitSelector === '#btn-save-event', 'Demo calendar mapping has valid submit selector');

const demoTask = DOMAIN_MAPPINGS.find(m => m.id === 'demo-tasks');
assert(demoTask && demoTask.fields.title === '#task-title', 'Demo task mapping has valid title selector');
assert(demoTask && demoTask.fields.assignee === '#task-assignee', 'Demo task mapping has valid assignee selector');

const gcal = DOMAIN_MAPPINGS.find(m => m.id === 'google-calendar');
assert(gcal && gcal.urlPattern.test('https://calendar.google.com/calendar/u/0/r'), 'Google Calendar URL pattern correctly matches calendar URL');

const gh = DOMAIN_MAPPINGS.find(m => m.id === 'github-issues');
assert(gh && gh.urlPattern.test('https://github.com/my-org/my-repo/issues/new'), 'GitHub Issues URL pattern correctly matches new issue URL');

// Summary
console.log(`\n==================================================`);
console.log(`Tests Finished: ${passed} Passed, ${failed} Failed`);
console.log(`==================================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
