/**
 * AI Intent Parser for Ghost Cursors
 * Supports Chrome Built-in AI Prompt API (Gemini Nano) with robust heuristic fallback.
 */

export async function checkAiAvailability() {
  try {
    if (typeof self !== 'undefined' && self.ai?.languageModel) {
      if (typeof self.ai.languageModel.availability === 'function') {
        const avail = await self.ai.languageModel.availability();
        return { available: avail === 'readily' || avail === 'after-download', mode: `chrome-nano (${avail})` };
      }
      if (typeof self.ai.languageModel.capabilities === 'function') {
        const caps = await self.ai.languageModel.capabilities();
        return { available: caps.available === 'readily' || caps.available === 'after-download', mode: `chrome-nano (${caps.available})` };
      }
      return { available: true, mode: 'chrome-nano' };
    }
  } catch (err) {
    console.warn('[Ghost Cursors] Error checking AI availability:', err);
  }
  return { available: false, mode: 'heuristic-fallback' };
}

export async function parseIntent(rawText) {
  if (!rawText || !rawText.trim()) {
    return null;
  }

  const cleanText = rawText.trim();
  const aiStatus = await checkAiAvailability();

  if (aiStatus.available) {
    try {
      const parsedWithAi = await parseWithBuiltInAi(cleanText);
      if (parsedWithAi && (parsedWithAi.title || parsedWithAi.actionType)) {
        return {
          ...parsedWithAi,
          sourceText: cleanText,
          parsedBy: aiStatus.mode,
          timestamp: Date.now()
        };
      }
    } catch (err) {
      console.warn('[Ghost Cursors] Built-in AI parsing failed, invoking heuristic fallback:', err);
    }
  }

  // Graceful Heuristic Fallback
  const heuristicResult = parseWithHeuristics(cleanText);
  return {
    ...heuristicResult,
    sourceText: cleanText,
    parsedBy: 'heuristic-fallback',
    timestamp: Date.now()
  };
}

async function parseWithBuiltInAi(text) {
  const systemPrompt = `You are an AI assistant parsing user intent from highlighted text.
Extract task or calendar meeting details. Respond strictly with valid JSON with this exact schema:
{
  "actionType": "meeting" | "task",
  "title": "short summary or title",
  "person": "name of attendee or assignee, or empty string",
  "date": "relative or absolute date string (e.g. tomorrow, Tuesday, 2026-11-06)",
  "time": "time string (e.g. 2:00 PM, 14:00) or empty string",
  "description": "supporting details or context",
  "tags": ["array", "of", "labels"]
}
Return only JSON. Do not include markdown code fences if possible.`;

  const session = await self.ai.languageModel.create({
    systemPrompt: systemPrompt
  });

  const response = await session.prompt(`Text to extract: "${text}"`);
  session.destroy?.();

  // Strip markdown formatting if returned
  let sanitized = response.trim();
  if (sanitized.startsWith('```json')) {
    sanitized = sanitized.slice(7);
  }
  if (sanitized.startsWith('```')) {
    sanitized = sanitized.slice(3);
  }
  if (sanitized.endsWith('```')) {
    sanitized = sanitized.slice(0, -3);
  }

  const parsed = JSON.parse(sanitized.trim());
  return parsed;
}

export function parseWithHeuristics(text) {
  const lower = text.toLowerCase();

  // 1. Determine Action Type
  const isMeeting = /\b(schedule|meeting|meet|sync|1-on-1|one-on-one|call|coffee chat|calendar|appointment|discuss)\b/i.test(lower);
  const actionType = isMeeting ? 'meeting' : 'task';

  // 2. Extract Person (Attendee or Assignee)
  let person = '';
  const personMatch = text.match(/\b(?:with|assigned to|assignee|for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/) ||
                      text.match(/\b(?:sync with|meet with|call with)\s+([A-Za-z]+)\b/i);
  if (personMatch) {
    person = personMatch[1].trim();
  }

  // 3. Extract Time
  let time = '';
  const timeMatch = text.match(/\b(?:at\s+)?((?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:am|pm|AM|PM))\b/) ||
                    text.match(/\b(?:at\s+)?((?:[01]?[0-9]|2[0-3]):[0-5][0-9])\b/);
  if (timeMatch) {
    time = timeMatch[1].trim();
  }

  // 4. Extract Date / Day
  let date = '';
  let computedDate = '';
  const dateKeywords = ['today', 'tomorrow', 'yesterday'];
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (const kw of dateKeywords) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(lower)) {
      date = kw.charAt(0).toUpperCase() + kw.slice(1);
      computedDate = resolveRelativeDate(kw);
      break;
    }
  }

  if (!date) {
    for (const day of daysOfWeek) {
      if (new RegExp(`\\b(?:on\\s+|due\\s+|next\\s+)?${day}\\b`, 'i').test(lower)) {
        date = day.charAt(0).toUpperCase() + day.slice(1);
        computedDate = resolveRelativeDay(day);
        break;
      }
    }
  }

  if (!date) {
    const explicitDateMatch = text.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?)\b/i) ||
                             text.match(/\b(\d{4}-\d{2}-\d{2})\b/) ||
                             text.match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/);
    if (explicitDateMatch) {
      date = explicitDateMatch[1];
      computedDate = explicitDateMatch[1];
    }
  }

  // 5. Generate Title
  let title = '';
  if (actionType === 'meeting') {
    if (person) {
      title = `Meeting with ${person}`;
    } else {
      title = 'Quick Sync / Meeting';
    }
    // Check for topic
    const topicMatch = text.match(/\b(?:to review|to discuss|regarding|about|for)\s+([^.,\n]+)/i);
    if (topicMatch) {
      const topic = topicMatch[1].trim();
      title = `${title}: ${topic}`;
    }
  } else {
    // Task title: look for urgent/bug/feature or first sentence
    const taskMatch = text.match(/\b(?:fix|implement|create|update|review|deploy|investigate)\s+([^.,\n]+)/i);
    if (taskMatch) {
      title = taskMatch[0].charAt(0).toUpperCase() + taskMatch[0].slice(1).trim();
    } else {
      const firstLine = text.split(/[.\n]/)[0].trim();
      title = firstLine.length > 50 ? firstLine.slice(0, 47) + '...' : firstLine;
    }
  }

  // 6. Tags
  const tags = [];
  if (/\b(urgent|asap|critical|high priority)\b/i.test(lower)) tags.push('Urgent');
  if (/\b(bug|defect|issue)\b/i.test(lower)) tags.push('Bug');
  if (/\b(meeting|sync)\b/i.test(lower)) tags.push('Meeting');
  if (/\b(1-on-1|sync)\b/i.test(lower)) tags.push('1-on-1');

  return {
    actionType,
    title,
    person,
    date,
    computedDate,
    time,
    description: text,
    tags
  };
}

function resolveRelativeDate(keyword) {
  const now = new Date();
  if (keyword.toLowerCase() === 'tomorrow') {
    now.setDate(now.getDate() + 1);
  } else if (keyword.toLowerCase() === 'yesterday') {
    now.setDate(now.getDate() - 1);
  }
  return formatDate(now);
}

function resolveRelativeDay(dayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  if (targetDay === -1) return '';

  const now = new Date();
  const currentDay = now.getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7; // Next upcoming day

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  return formatDate(targetDate);
}

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
