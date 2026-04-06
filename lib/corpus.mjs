import path from 'node:path';
import { readFile } from 'node:fs/promises';

const DATA_PATH = path.resolve(process.cwd(), 'data/torah-compact.json');
const TAAMIM_CHAR_REGEX = /[\u0591-\u05AF\u05BF\u05C0\u05C4\u05C5]/;
const METEG = '\u05BD';
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

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function splitHebrewWords(text) {
  return normalizeWhitespace(text)
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);
}

function isHebrewLetter(character) {
  return /[\u05D0-\u05EA]/.test(character);
}

function hasHebrewLetters(text) {
  return Array.from(text).some((character) => isHebrewLetter(character));
}

function normalizeTypedTaamim(text) {
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

function normalizeWordTaamim(word, keepMetegIndex) {
  const firstLetterIndex = Array.from(word).findIndex((character) => isHebrewLetter(character));
  const lastLetterIndex =
    Array.from(word)
      .map((character, index) => ({ character, index }))
      .filter(({ character }) => isHebrewLetter(character))
      .at(-1)?.index ?? -1;
  const qadmaPashtaPositions = Array.from(word)
    .map((character, index) => ({ character, index }))
    .filter(({ character }) => character === PASHTA_MARK)
    .map(({ index }) => index);
  const hasDoubledPashta = qadmaPashtaPositions.length > 1;
  let pashtaEmitted = false;
  const singleInstanceTaamim = new Set();
  let normalized = '';

  for (let index = 0; index < word.length; index += 1) {
    const character = word[index];

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

    if (character === ZARQA_MARK || character === ZINOR_MARK) {
      if (singleInstanceTaamim.has(ZARQA_TOKEN)) {
        continue;
      }
      singleInstanceTaamim.add(ZARQA_TOKEN);
      normalized += ZARQA_TOKEN;
      continue;
    }

    if (character === YETIV_MARK) {
      normalized += firstLetterIndex === -1 || index < firstLetterIndex ? YETIV_TOKEN : MAHPAKH_TOKEN;
      continue;
    }

    if (character === MAHPAKH_MARK) {
      normalized += MAHPAKH_TOKEN;
      continue;
    }

    if (character === PASHTA_MARK) {
      const isPashta = hasDoubledPashta || index > lastLetterIndex;
      if (isPashta) {
        if (!pashtaEmitted) {
          singleInstanceTaamim.add(PASHTA_TOKEN);
          normalized += PASHTA_TOKEN;
          pashtaEmitted = true;
        }
      } else {
        normalized += QADMA_TOKEN;
      }
      continue;
    }

    if (character === QADMA_MARK) {
      normalized += QADMA_TOKEN;
      continue;
    }

    if (
      character === SEGOL_MARK ||
      character === TELISHA_GEDOLA_MARK ||
      character === TELISHA_KETANA_MARK
    ) {
      if (singleInstanceTaamim.has(character)) {
        continue;
      }
      singleInstanceTaamim.add(character);
      normalized += character;
      continue;
    }

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

function normalizeTaamim(text, keepMetegIndex) {
  if (!hasHebrewLetters(text)) {
    return normalizeTypedTaamim(text);
  }

  let searchStart = 0;

  return splitHebrewWords(text)
    .map((word) => {
      const wordOffset = text.indexOf(word, searchStart);
      searchStart = wordOffset + word.length;
      const relativeMetegIndex =
        keepMetegIndex >= wordOffset && keepMetegIndex < wordOffset + word.length
          ? keepMetegIndex - wordOffset
          : -1;
      return normalizeWordTaamim(word, relativeMetegIndex);
    })
    .join('');
}

function extractTaamim(text) {
  return normalizeTaamim(text, text.lastIndexOf(METEG));
}

function buildWordRanges(text) {
  const normalizedText = normalizeWhitespace(text);
  const words = splitHebrewWords(normalizedText);
  const verseFinalMetegIndex = normalizedText.lastIndexOf(METEG);
  let cursor = 0;
  let charCursor = 0;

  return words.map((word) => {
    const wordStart = charCursor;
    const wordEnd = wordStart + word.length;
    const keepMetegIndex =
      verseFinalMetegIndex >= wordStart && verseFinalMetegIndex < wordEnd
        ? verseFinalMetegIndex - wordStart
        : -1;
    const taamim = normalizeTaamim(word, keepMetegIndex);
    const start = cursor;
    cursor += taamim.length;
    charCursor = wordEnd + 1;
    return {
      text: word,
      taamim,
      start,
      end: cursor,
    };
  });
}

let corpusPromise;

async function loadCorpus() {
  const compactVerses = JSON.parse(await readFile(DATA_PATH, 'utf8'));

  const verseMap = new Map();
  const chapterMap = new Map();
  const bookMap = new Map();
  const indexedVerses = compactVerses.map((verse) => {
    const record = {
      ref: verse.r,
      book: verse.b,
      bookHebrew: verse.h,
      chapter: verse.c,
      verse: verse.v,
      text: verse.t,
      verseTaamimSequence: verse.q,
      words: buildWordRanges(verse.t),
    };

    verseMap.set(record.ref, {
      ref: record.ref,
      book: record.book,
      bookHebrew: record.bookHebrew,
      chapter: record.chapter,
      verse: record.verse,
      text: record.text,
    });

    const chapterKey = `${record.book}:${record.chapter}`;
    const chapterVerses = chapterMap.get(chapterKey) ?? [];
    chapterVerses.push(verseMap.get(record.ref));
    chapterMap.set(chapterKey, chapterVerses);

    const bookSummary = bookMap.get(record.book) ?? {
      book: record.book,
      bookHebrew: record.bookHebrew,
      chapters: new Set(),
    };
    bookSummary.chapters.add(record.chapter);
    bookMap.set(record.book, bookSummary);

    return record;
  });

  return {
    indexedVerses,
    verseMap,
    chapterMap,
    books: Array.from(bookMap.values()).map((book) => ({
      book: book.book,
      bookHebrew: book.bookHebrew,
      chapters: Array.from(book.chapters).sort((left, right) => left - right),
    })),
  };
}

async function getCorpus() {
  corpusPromise ??= loadCorpus();
  return corpusPromise;
}

export async function getBooks() {
  const corpus = await getCorpus();
  return corpus.books;
}

export async function getChapter(book, chapter) {
  const corpus = await getCorpus();
  return corpus.chapterMap.get(`${book}:${chapter}`) ?? null;
}

export async function searchTaamim(queryText) {
  const query = extractTaamim(String(queryText ?? ''));
  if (!query) {
    return [];
  }

  const corpus = await getCorpus();
  const results = [];

  for (const verse of corpus.indexedVerses) {
    if (!verse.verseTaamimSequence) {
      continue;
    }

    let searchFrom = 0;
    while (searchFrom <= verse.verseTaamimSequence.length - query.length) {
      const matchIndex = verse.verseTaamimSequence.indexOf(query, searchFrom);
      if (matchIndex === -1) {
        break;
      }

      const matchEnd = matchIndex + query.length;
      const startWordIndex = verse.words.findIndex((word) => matchIndex < word.end);
      const endWordIndex = verse.words.findIndex((word) => matchEnd <= word.end);

      let adjacentDuplicateSpansSingleWord = false;
      for (let index = 0; index < query.length - 1; index += 1) {
        if (query[index] !== query[index + 1]) {
          continue;
        }

        const leftWordIndex = verse.words.findIndex(
          (word) => matchIndex + index >= word.start && matchIndex + index < word.end,
        );
        const rightWordIndex = verse.words.findIndex(
          (word) => matchIndex + index + 1 >= word.start && matchIndex + index + 1 < word.end,
        );

        if (leftWordIndex !== -1 && leftWordIndex === rightWordIndex) {
          adjacentDuplicateSpansSingleWord = true;
          break;
        }
      }

      if (startWordIndex !== -1 && endWordIndex !== -1 && !adjacentDuplicateSpansSingleWord) {
        results.push({
          ref: verse.ref,
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
          startWordIndex,
          endWordIndex,
          matchedTaamim: query,
          matchedText: verse.words
            .slice(startWordIndex, endWordIndex + 1)
            .map((word) => word.text)
            .join(' '),
          contextText: verse.text,
        });
      }

      searchFrom = matchIndex + 1;
    }
  }

  return results;
}
