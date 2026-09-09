import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extractTaamim, normalizeTaamim, resolveCorpus } from './taamim.mjs';

const BOOK_RECORDS = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data/tanakh-books.json'), 'utf8'),
);
const BOOK_ORDER = BOOK_RECORDS.map((book) => book.english);
const TORAH_BOOKS = new Set(BOOK_RECORDS.filter((book) => book.section === 'torah').map((book) => book.english));
const EMET_BOOKS = new Set(BOOK_RECORDS.filter((book) => book.trop === 'emet').map((book) => book.english));
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

function buildWordRanges(text, system) {
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
    const taamim = normalizeTaamim(word, keepMetegIndex, system);
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

function hydrateNotes(notes = []) {
  return notes.map((note) => ({
    index: note.i,
    rawNote: note.r,
    noteText: note.t,
    tradition: note.y,
    action: note.a,
    replacement: note.p ?? null,
    precedingSegment: note.b ?? '',
    precedingToken: note.bt ?? '',
    followingSegment: note.f ?? '',
    followingToken: note.ft ?? '',
  }));
}

function corpusFile(system) {
  if (system === 'emet') {
    return path.join(process.cwd(), 'data/emet-compact.json');
  }

  if (system === 'nach') {
    return path.join(process.cwd(), 'data/nach-compact.json');
  }

  return path.join(process.cwd(), 'data/torah-compact.json');
}

function chapterList(count) {
  return Array.from({ length: Number(count) || 0 }, (_, index) => index + 1);
}

async function loadCorpus(system) {
  const tropSystem = system === 'emet' ? 'emet' : 'torah';
  const compactVerses = JSON.parse(await readFile(corpusFile(system), 'utf8'));

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
      baseText: verse.m ?? verse.t,
      notes: hydrateNotes(verse.n),
      verseTaamimSequence: verse.q,
      words: buildWordRanges(verse.t, tropSystem),
    };

    verseMap.set(record.ref, {
      ref: record.ref,
      book: record.book,
      bookHebrew: record.bookHebrew,
      chapter: record.chapter,
      verse: record.verse,
      text: record.text,
      baseText: record.baseText,
      notes: record.notes,
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
    books: Array.from(bookMap.values())
      .map((book) => ({
        book: book.book,
        bookHebrew: book.bookHebrew,
        chapters: Array.from(book.chapters).sort((left, right) => left - right),
      }))
      .sort((left, right) => BOOK_ORDER.indexOf(left.book) - BOOK_ORDER.indexOf(right.book)),
  };
}

const corpusPromises = {
  torah: null,
  nach: null,
  emet: null,
};

async function getCorpus(system = 'torah') {
  const key = system === 'emet' || system === 'nach' ? system : 'torah';
  corpusPromises[key] ??= loadCorpus(key);
  return corpusPromises[key];
}

function dataSystemForBook(book, corpus = 'torah') {
  if (resolveCorpus(corpus) === 'emet') {
    return 'emet';
  }

  return TORAH_BOOKS.has(book) ? 'torah' : 'nach';
}

export async function getBooks(corpus = 'torah', includeNach = false) {
  const system = resolveCorpus(corpus);
  return BOOK_RECORDS.filter((book) => {
    if (system === 'emet') {
      return EMET_BOOKS.has(book.english);
    }

    if (book.section === 'torah') {
      return true;
    }

    return includeNach;
  }).map((book) => ({
    book: book.english,
    bookHebrew: book.hebrew,
    chapters: chapterList(book.chapterCount),
  }));
}

export async function getChapter(book, chapter, corpus = 'torah') {
  const loaded = await getCorpus(dataSystemForBook(book, corpus));
  return loaded.chapterMap.get(`${book}:${chapter}`) ?? null;
}

export async function searchTaamim(queryText, corpus = 'torah', includeNach = false) {
  const system = resolveCorpus(corpus);
  const query = extractTaamim(String(queryText ?? ''), system);
  if (!query) {
    return [];
  }

  const sources =
    system === 'emet'
      ? [await getCorpus('emet')]
      : includeNach
        ? [await getCorpus('torah'), await getCorpus('nach')]
        : [await getCorpus('torah')];
  const results = [];

  for (const loaded of sources) {
  for (const verse of loaded.indexedVerses) {
    if (system === 'emet' && !EMET_BOOKS.has(verse.book)) {
      continue;
    }

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
          nextTaamim: verse.verseTaamimSequence.slice(matchEnd),
          matchedText: verse.words
            .slice(startWordIndex, endWordIndex + 1)
            .map((word) => word.text)
            .join(' '),
          contextText: verse.text,
          baseContextText: verse.baseText,
          notes: verse.notes,
        });
      }

      searchFrom = matchIndex + 1;
    }
  }
  }

  return results;
}
