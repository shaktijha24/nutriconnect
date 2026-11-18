// Small politeness checker used on provider chat messages and client feedback.
const RUDE_WORDS = [
  'stupid', 'idiot', 'shut up', 'dumb', 'fool', 'useless', 'nonsense', 'lazy', 'loser',
  'get lost', 'pathetic', 'worthless', 'ugly', 'moron', 'fatso', 'disgusting', 'shameless',
];

const COMPLAINT_WORDS = [
  'rude', 'impolite', 'disrespect', 'insult', 'shouted', 'yelled', 'abusive', 'harass',
  'unprofessional', 'body shaming', 'body-shaming', 'mocked', 'arrogant',
];

const has = (text, word) => new RegExp(`\\b${word.replace(/[-]/g, '[- ]?')}\\b`, 'i').test(text);

export function checkPoliteness(text = '') {
  const hits = RUDE_WORDS.filter((w) => has(text, w));
  const letters = text.replace(/[^a-zA-Z]/g, '');
  const shouting = letters.length >= 12 && letters === letters.toUpperCase();
  const reasons = hits.map((h) => `used the word "${h}"`);
  if (shouting) reasons.push('wrote in all-caps (shouting)');
  return { flagged: reasons.length > 0, reasons };
}

export function complaintSignals(text = '') {
  return COMPLAINT_WORDS.filter((w) => has(text, w));
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'oh'];

/**
 * Detects phone numbers in chat, including ones disguised with spaces, dots, dashes,
 * brackets, "+91", or written as words ("nine eight seven six ...").
 */
export function containsPhoneNumber(text = '') {
  // digits separated by common filler characters: 98765 43210, 98-765-43210, (987) 654.3210
  const digitRuns = text.match(/\+?\d[\d\s.\-()/]{6,}\d/g) || [];
  if (digitRuns.some((run) => run.replace(/\D/g, '').length >= 10)) return true;
  // numbers spelled out as words
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  let streak = 0;
  for (const w of words) {
    streak = NUMBER_WORDS.includes(w) || /^\d$/.test(w) ? streak + 1 : 0;
    if (streak >= 10) return true;
  }
  return false;
}
