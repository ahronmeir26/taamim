import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extractTaamim, normalizeTaamim, resolveCorpus } from './taamim.mjs';

const TORAH_DATA_PATH = path.resolve(process.cwd(), 'data/tanakh-compact.json');
const EMET_DATA_PATH = path.resolve(process.cwd(), 'data/emet-compact.json');
const BOOK_ORDER = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'data/tanakh-books.json'), 'utf8'),
).map((book) => book.english);
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

async function loadCorpus(dataPath, system) {
  const compactVerses = JSON.parse(await readFile(dataPath, 'utf8'));

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
      words: buildWordRanges(verse.t, system),
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
  emet: null,
};

async function getCorpus(corpus = 'torah') {
  const system = resolveCorpus(corpus);
  corpusPromises[system] ??= loadCorpus(
    system === 'emet' ? EMET_DATA_PATH : TORAH_DATA_PATH,
    system,
  );
  return corpusPromises[system];
}

export async function getBooks(corpus = 'torah') {
  const loaded = await getCorpus(corpus);
  return loaded.books;
}

export async function getChapter(book, chapter, corpus = 'torah') {
  const loaded = await getCorpus(corpus);
  return loaded.chapterMap.get(`${book}:${chapter}`) ?? null;
}

export async function searchTaamim(queryText, corpus = 'torah') {
  const system = resolveCorpus(corpus);
  const query = extractTaamim(String(queryText ?? ''), system);
  if (!query) {
    return [];
  }

  const loaded = await getCorpus(system);
  const results = [];

  for (const verse of loaded.indexedVerses) {
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
          baseContextText: verse.baseText,
          notes: verse.notes,
        });
      }

      searchFrom = matchIndex + 1;
    }
  }

  return results;
}
