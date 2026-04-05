const TAAMIM_CHAR_REGEX = /[\u0591-\u05AF\u05BF\u05C0\u05C4\u05C5]/;
const VOWELS_REGEX = /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/g;
const LETTER_REGEX = /[\u05D0-\u05EA]/g;
const METEG = '\u05BD';

function normalizeTaamim(text: string, keepMetegIndex: number): string {
  let normalized = '';

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (TAAMIM_CHAR_REGEX.test(character)) {
      normalized += character;
      continue;
    }

    if (character === METEG && index === keepMetegIndex) {
      normalized += character;
    }
  }

  return normalized;
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

export function extractTaamim(text: string, verseText?: string): string {
  const keepMetegIndex =
    verseText && selectionIncludesVerseFinalMeteg(text, verseText)
      ? text.lastIndexOf(METEG)
      : verseText
        ? -1
        : getMetegIndexForWholeText(text);

  return normalizeTaamim(text, keepMetegIndex);
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
