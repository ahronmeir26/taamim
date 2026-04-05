import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BOOKS = [
  { english: 'Genesis', hebrew: 'בראשית' },
  { english: 'Exodus', hebrew: 'שמות' },
  { english: 'Leviticus', hebrew: 'ויקרא' },
  { english: 'Numbers', hebrew: 'במדבר' },
  { english: 'Deuteronomy', hebrew: 'דברים' },
];

const TAAMIM_REGEX = /[\u0591-\u05AF\u05BF\u05C0\u05C4\u05C5]/g;
const TAAMIM_CHAR_REGEX = /[\u0591-\u05AF\u05BF\u05C0\u05C4\u05C5]/;
const VOWELS_REGEX = /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/g;
const LETTER_REGEX = /[\u05D0-\u05EA]/g;
const METEG = '\u05BD';

function extract(text, regex) {
  return text.match(regex)?.join('') ?? '';
}

function normalizeTaamim(text, keepMetegIndex) {
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

function stripHtml(text) {
  return text.replace(/<[^>]+>/g, '');
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&thinsp;/g, ' ')
    .replace(/&ensp;/g, ' ')
    .replace(/&emsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_match, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, codePoint) =>
      String.fromCodePoint(parseInt(codePoint, 16)),
    )
    .replace(/&[a-zA-Z]+;/g, ' ');
}

function cleanDisplayText(text) {
  return decodeHtmlEntities(stripHtml(text))
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2000-\u200A]/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/\u205F/g, ' ')
    .replace(/\u3000/g, ' ')
    .replace(/׀/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitWords(text) {
  return cleanDisplayText(text)
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);
}

const verses = [];

for (const book of BOOKS) {
  const inputPath = path.resolve('data/raw', `${book.english}.json`);
  const raw = JSON.parse(await readFile(inputPath, 'utf8'));
  const chapters = raw.text?.he ?? raw.text?.text ?? raw.text?.chapter ?? raw.text?.text ?? [];

  chapters.forEach((chapter, chapterIndex) => {
    chapter.forEach((verseText, verseIndex) => {
      const cleanVerseText = cleanDisplayText(verseText);
      verses.push({
        r: `${book.english} ${chapterIndex + 1}:${verseIndex + 1}`,
        b: book.english,
        h: book.hebrew,
        c: chapterIndex + 1,
        v: verseIndex + 1,
        t: cleanVerseText,
        q: normalizeTaamim(cleanVerseText, cleanVerseText.lastIndexOf(METEG)),
      });
    });
  });
}

const outputPath = path.resolve('data/torah-compact.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(verses));
console.log(`Wrote ${outputPath}`);
