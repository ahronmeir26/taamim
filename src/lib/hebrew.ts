const TAAMIM_CHAR_REGEX = /[\u0591-\u05AF\u05BF\u05C0\u05C4\u05C5]/;
const VOWELS_REGEX = /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/g;
const LETTER_REGEX = /[\u05D0-\u05EA]/g;
const METEG = '\u05BD';
const YETIV_MARK = '\u059A';
export const MAHPAKH_MARK = '\u05A4';
const PASHTA_MARK = '\u0599';
export const QADMA_MARK = '\u05A8';
const SEGOL_MARK = '\u0592';
const TELISHA_GEDOLA_MARK = '\u05A0';
const TELISHA_KETANA_MARK = '\u05A9';
const ZARQA_MARK = '\u0598';
export const ZINOR_MARK = '\u05AE';
export const YETIV_TOKEN = '\uE000';
export const MAHPAKH_TOKEN = '\uE001';
export const QADMA_TOKEN = '\uE002';
export const PASHTA_TOKEN = '\uE003';
export const ZARQA_TOKEN = '\uE004';

export type TaamimSystem = 'torah' | 'emet';

export const OLE_MARK = '\u05AB';
export const ILUY_MARK = '\u05AC';
export const DEHI_MARK = '\u05AD';
export const ATNACH_HAFUKH_MARK = '\u05A2';
export const GALGAL_MARK = '\u05AA';
export const GERESH_MUQDAM_MARK = '\u059D';
export const PASEQ_MARK = '\u05C0';
export const MERCHA_MARK = '\u05A5';
export const MUNACH_MARK = '\u05A3';
export const ATNACH_MARK = '\u0591';
export const REVIA_MARK = '\u0597';
export const PAZER_MARK = '\u05A1';
export const SHALSHELET_MARK = '\u0593';
export const TARHA_MARK = '\u0596';
export const TSINNORIT_MARK = '\u0598';
export const SILLUQ_MARK = '\u05BD';

function isHebrewLetter(character: string): boolean {
  return LETTER_REGEX.test(character);
}

function hasHebrewLetters(text: string): boolean {
  return Array.from(text).some((character) => isHebrewLetter(character));
}

function normalizeTypedTaamimTorah(text: string): string {
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

function normalizeTypedTaamimEmet(text: string): string {
  let normalized = '';

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === METEG || TAAMIM_CHAR_REGEX.test(character)) {
      normalized += character;
    }
  }

  return normalized;
}

function normalizeWordTaamimTorah(word: string, keepMetegIndex: number): string {
  const firstLetterIndex = Array.from(word).findIndex((character) => isHebrewLetter(character));
  const seenTaamim = new Set<string>();
  let normalized = '';
  const appendUniqueTaam = (taam: string): void => {
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
      appendUniqueTaam(
        firstLetterIndex === -1 || index < firstLetterIndex ? YETIV_TOKEN : MAHPAKH_TOKEN,
      );
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

function normalizeWordTaamimEmet(word: string, keepMetegIndex: number): string {
  const seenTaamim = new Set<string>();
  let normalized = '';
  const appendUniqueTaam = (taam: string): void => {
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

function normalizeTaamim(text: string, keepMetegIndex: number, system: TaamimSystem): string {
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

function getMetegIndexForWholeText(text: string): number {
  return text.lastIndexOf(METEG);
}

function selectionIncludesVerseFinalMeteg(selectionText: string, verseText: string): boolean {
  const verseFinalMetegIndex = verseText.lastIndexOf(METEG);
  if (verseFinalMetegIndex === -1) {
    return false;
  }

  let searchStart = 0;
  while (searchStart < verseText.length) {
    const matchIndex = verseText.indexOf(selectionText, searchStart);
    if (matchIndex === -1) {
      break;
    }

    const matchEnd = matchIndex + selectionText.length;
    if (verseFinalMetegIndex >= matchIndex && verseFinalMetegIndex < matchEnd) {
      return true;
    }

    searchStart = matchIndex + 1;
  }

  return false;
}

export function extractTaamim(
  text: string,
  verseText?: string,
  system: TaamimSystem = 'torah',
): string {
  const keepMetegIndex =
    verseText && selectionIncludesVerseFinalMeteg(text, verseText)
      ? text.lastIndexOf(METEG)
      : verseText
        ? -1
        : getMetegIndexForWholeText(text);

  return normalizeTaamim(text, keepMetegIndex, system);
}

export function extractVowels(text: string): string {
  return text.match(VOWELS_REGEX)?.join('') ?? '';
}

export function extractBaseLetters(text: string): string {
  return text.match(LETTER_REGEX)?.join('') ?? '';
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function splitHebrewWords(text: string): string[] {
  return normalizeWhitespace(text)
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);
}

export function highlightWords(
  text: string,
  startWordIndex: number,
  endWordIndex: number,
): { text: string; isMatch: boolean }[] {
  return splitHebrewWords(text).map((word, index) => ({
    text: word,
    isMatch: index >= startWordIndex && index <= endWordIndex,
  }));
}

export function encodeSearchQuery(query: string): string {
  return Array.from(new TextEncoder().encode(query), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function displayTaamimCharacter(character: string): string {
  if (character === YETIV_TOKEN) {
    return '֚';
  }

  if (character === MAHPAKH_TOKEN) {
    return '֤';
  }

  if (character === QADMA_TOKEN) {
    return '֨';
  }

  if (character === PASHTA_TOKEN) {
    return '֙';
  }

  if (character === ZARQA_TOKEN) {
    return '֘';
  }

  return character;
}
