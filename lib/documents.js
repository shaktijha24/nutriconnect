// Validates the expert application document against the format of the sample document.
export const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB
export const MIN_WORDS = 200; // the blank template has ~150 words, so it must actually be filled in

// Sections that must appear (as headings) — same as the sample document on /sample-document
export const REQUIRED_SECTIONS = [
  { key: 'identity', label: 'Professional identity', re: /professional\s+identity/i },
  { key: 'qualifications', label: 'Qualifications & licence', re: /qualifications?/i },
  { key: 'experience', label: 'Experience', re: /experience/i },
  { key: 'approach', label: 'Consultation approach', re: /consultation\s+approach|approach/i },
  { key: 'sample', label: 'Sample diet plan', re: /sample\s+diet\s+plan/i },
  { key: 'declaration', label: 'Declaration', re: /declaration/i },
];

const TYPES = {
  pdf: { mime: 'application/pdf', magic: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  docx: {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    magic: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04, // ZIP container
  },
};

async function extractText(kind, buffer) {
  if (kind === 'pdf') {
    const { extractText: pdfText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await pdfText(pdf, { mergePages: true });
    return text || '';
  }
  const mammoth = (await import('mammoth')).default;
  const { value } = await mammoth.extractRawText({ buffer });
  return value || '';
}

/**
 * Returns { ok, errors[], kind, mime, sectionsFound[], wordCount }.
 * Checks: extension, size, real file signature (not just the name), readable text, required sections, length.
 */
export async function validateApplicationDocument(filename, buffer) {
  const errors = [];
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const kind = TYPES[ext] ? ext : null;
  if (!kind) return { ok: false, errors: ['Only PDF (.pdf) or Word (.docx) files are accepted.'] };
  if (buffer.length > MAX_DOC_BYTES) return { ok: false, errors: ['File is larger than 5 MB.'] };
  if (!TYPES[kind].magic(buffer)) {
    return { ok: false, errors: [`This file is not a real .${kind} file (it may have been renamed). Please export it again as ${kind.toUpperCase()}.`] };
  }

  let text = '';
  try {
    text = await extractText(kind, buffer);
  } catch {
    return { ok: false, errors: ['We could not read this file. It may be damaged or password-protected.'] };
  }
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 20) {
    return { ok: false, errors: ['No readable text found. If this is a scanned PDF, please upload a typed PDF or Word file instead.'] };
  }

  const sectionsFound = REQUIRED_SECTIONS.filter((s) => s.re.test(text)).map((s) => s.label);
  const missing = REQUIRED_SECTIONS.filter((s) => !s.re.test(text)).map((s) => s.label);
  if (missing.length) errors.push(`Missing section(s) from the sample format: ${missing.join(', ')}.`);
  if (wordCount < MIN_WORDS) errors.push(`The document is too short (${wordCount} words). Please write at least ${MIN_WORDS} words.`);

  return { ok: errors.length === 0, errors, kind, mime: TYPES[kind].mime, sectionsFound, wordCount };
}
