export const TAAMIM_CHAR_REGEX = /[\u0591-\u05AF\u05BF\u05C0\u05C4\u05C5]/;
const LETTER_REGEX = /[\u05D0-\u05EA]/g;
export const METEG = '\u05BD';
const YETIV_MARK = '\u059A';
const MAHPAKH_MARK = '\u05A4';
const PASHTA_MARK = '\u0599';
const QADMA_MARK = '\u05A8';
const SEGOL_MARK = '\u0592';
const TELISHA_GEDOLA_MARK = '\u05A0';
const TELISHA_KETANA_MARK = '\u05A9';
const ZARQA_MARK = '\u0598';
const ZINOR_MARK = '\u05AE';
const YETIV_TOKEN = '\uE000';
const MAHPAKH_TOKEN = '\uE001';
const QADMA_TOKEN = '\uE002';
const PASHTA_TOKEN = '\uE003';
const ZARQA_TOKEN = '\uE004';

export const EMET_BOOKS = new Set(['Psalms', 'Proverbs', 'Job']);

export function resolveCorpus(value) {
  return String(value ?? '').toLowerCase() === 'emet' ? 'emet' : 'torah';
}

export function resolveNach(value) {
  const normalized = String(value ?? '').toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'nach';
}

export function decodeSearchQuery(hexValue, rawValue) {
  const hex = String(hexValue ?? '').trim();
  if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
    const masked = Buffer.from(hex, 'hex');
    for (let index = 0; index < masked.length; index += 1) {
      masked[index] ^= 0x5a;
    }
    return masked.toString('utf8');
  }

  return String(rawValue ?? '');
}

export function resolveSearchParams(source = {}) {
  return {
    query: decodeSearchQuery(source.q, source.query),
    corpus: resolveCorpus(source.corpus),
    includeNach: resolveNach(source.nach),
  };
}

function isHebrewLetter(character) {
  return /[\u05D0-\u05EA]/.test(character);
}

function hasHebrewLetters(text) {
  return Array.from(text).some((character) => isHebrewLetter(character));
}

function normalizeTypedTaamimTorah(text) {
  let normalized = '';

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (
      character === YETIV_TOKEN ||
      character === MAHPAKH_TOKEN ||
      character === QADMA_TOKEN ||
      character === PASHTA_TOKEN ||
      character === ZARQA_TOKEN
    ) {
      normalized += character;
      continue;
    }

    if (character === YETIV_MARK) {
      normalized += YETIV_TOKEN;
      continue;
    }

    if (character === MAHPAKH_MARK) {
      normalized += MAHPAKH_TOKEN;
      continue;
    }

    if (character === PASHTA_MARK) {
      normalized += PASHTA_TOKEN;
      continue;
    }

    if (character === QADMA_MARK) {
      normalized += QADMA_TOKEN;
      continue;
    }

    if (character === ZARQA_MARK || character === ZINOR_MARK) {
      normalized += ZARQA_TOKEN;
      continue;
    }

    if (
      character === SEGOL_MARK ||
      character === TELISHA_GEDOLA_MARK ||
      character === TELISHA_KETANA_MARK ||
      TAAMIM_CHAR_REGEX.test(character)
    ) {
      normalized += character;
      continue;
    }

    if (character === METEG) {
      normalized += character;
    }
  }

  return normalized;
}

function normalizeTypedTaamimEmet(text) {
  let normalized = '';

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === METEG || TAAMIM_CHAR_REGEX.test(character)) {
      normalized += character;
    }
  }

  return normalized;
}

function normalizeWordTaamimTorah(word, keepMetegIndex) {
  const firstLetterIndex = Array.from(word).findIndex((character) => LETTER_REGEX.test(character));
  const seenTaamim = new Set();
  let normalized = '';
  const appendUniqueTaam = (taam) => {
    if (seenTaamim.has(taam)) {
      return;
    }
    seenTaamim.add(taam);
    normalized += taam;
  };

  for (let index = 0; index < word.length; index += 1) {
    const character = word[index];

    if (
      character === YETIV_TOKEN ||
      character === MAHPAKH_TOKEN ||
      character === QADMA_TOKEN ||
      character === PASHTA_TOKEN ||
      character === ZARQA_TOKEN
    ) {
      appendUniqueTaam(character);
      continue;
    }

    if (character === ZARQA_MARK || character === ZINOR_MARK) {
      appendUniqueTaam(ZARQA_TOKEN);
      continue;
    }

    if (character === YETIV_MARK) {
      appendUniqueTaam(firstLetterIndex === -1 || index < firstLetterIndex ? YETIV_TOKEN : MAHPAKH_TOKEN);
      continue;
    }

    if (character === MAHPAKH_MARK) {
      appendUniqueTaam(MAHPAKH_TOKEN);
      continue;
    }

    if (character === PASHTA_MARK) {
      appendUniqueTaam(PASHTA_TOKEN);
      continue;
    }

    if (character === QADMA_MARK) {
      appendUniqueTaam(QADMA_TOKEN);
      continue;
    }

    if (
      character === SEGOL_MARK ||
      character === TELISHA_GEDOLA_MARK ||
      character === TELISHA_KETANA_MARK
    ) {
      appendUniqueTaam(character);
      continue;
    }

    if (TAAMIM_CHAR_REGEX.test(character)) {
      appendUniqueTaam(character);
      continue;
    }

    if (character === METEG && index === keepMetegIndex) {
      normalized += character;
    }
  }

  return normalized;
}

function normalizeWordTaamimEmet(word, keepMetegIndex) {
  const seenTaamim = new Set();
  let normalized = '';
  const appendUniqueTaam = (taam) => {
    if (seenTaamim.has(taam)) {
      return;
    }
    seenTaamim.add(taam);
    normalized += taam;
  };

  for (let index = 0; index < word.length; index += 1) {
    const character = word[index];

    if (TAAMIM_CHAR_REGEX.test(character)) {
      appendUniqueTaam(character);
      continue;
    }

    if (character === METEG && index === keepMetegIndex) {
      normalized += character;
    }
  }

  return normalized;
}

function splitHebrewWords(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);
}

export function normalizeTaamim(text, keepMetegIndex, system = 'torah') {
  const isEmet = system === 'emet';

  if (!hasHebrewLetters(text)) {
    return isEmet ? normalizeTypedTaamimEmet(text) : normalizeTypedTaamimTorah(text);
  }

  let searchStart = 0;
  const normalizeWord = isEmet ? normalizeWordTaamimEmet : normalizeWordTaamimTorah;

  return splitHebrewWords(text)
    .map((word) => {
      const wordOffset = text.indexOf(word, searchStart);
      searchStart = wordOffset + word.length;
      const relativeMetegIndex =
        keepMetegIndex >= wordOffset && keepMetegIndex < wordOffset + word.length
          ? keepMetegIndex - wordOffset
          : -1;
      return normalizeWord(word, relativeMetegIndex);
    })
    .join('');
}

export function extractTaamim(text, system = 'torah') {
  return normalizeTaamim(text, text.lastIndexOf(METEG), system);
}
