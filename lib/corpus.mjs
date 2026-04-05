import path from 'node:path';
import { readFile } from 'node:fs/promises';

const DATA_PATH = path.resolve(process.cwd(), 'data/torah-compact.json');
const TAAMIM_CHAR_REGEX = /[\u0591-\u05AF\u05BF\u05C0\u05C4\u05C5]/;
const METEG = '\u05BD';

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function splitHebrewWords(text) {
  return normalizeWhitespace(text)
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);
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

      if (startWordIndex !== -1 && endWordIndex !== -1) {
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
