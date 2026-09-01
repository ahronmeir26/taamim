import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { METEG, normalizeTaamim } from '../lib/taamim.mjs';

const BOOKS = JSON.parse(await readFile(path.resolve('data/tanakh-books.json'), 'utf8'));

const FOOTNOTE_REGEX = /<sup class="footnote-marker">\*<\/sup><i class="footnote">\((.*?)\)<\/i>/g;
const NOTE_MARKER_PREFIX = '[[FN';
const DEFAULT_TRADITION = 'sephardi-ashkenazi';

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

function cleanDisplayText(text, { keepPaseq = false } = {}) {
  let cleaned = decodeHtmlEntities(stripHtml(text))
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2000-\u200A]/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/\u205F/g, ' ')
    .replace(/\u3000/g, ' ');

  if (keepPaseq) {
    cleaned = cleaned.replace(/\s*׀\s*/g, '׀ ');
  } else {
    cleaned = cleaned.replace(/׀/g, ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

function noteMarker(index) {
  return `${NOTE_MARKER_PREFIX}${index}]]`;
}

function extractVerseNotes(rawVerseText) {
  const notes = [];
  const textWithMarkers = rawVerseText.replace(FOOTNOTE_REGEX, (_match, rawNote) => {
    const marker = noteMarker(notes.length);
    notes.push({
      index: notes.length,
      rawNote,
      noteText: cleanDisplayText(rawNote),
    });
    return marker;
  });

  return {
    notes,
    textWithMarkers,
  };
}

function classifyNote(noteText) {
  if (noteText === 'אין פרשה בספרי ספרד ואשכנז') {
    return { tradition: 'sephardi-ashkenazi', action: 'remove-break', replacement: null };
  }

  if (noteText === 'אין פרשה בספרי תימן') {
    return { tradition: 'teimani', action: 'remove-break', replacement: null };
  }

  const sephardiPrefixes = ['בספרי ספרד ואשכנז ', 'בספרי ספרד ורוב ספרי אשכנז '];
  for (const prefix of sephardiPrefixes) {
    if (noteText.startsWith(prefix)) {
      const remainder = noteText.slice(prefix.length).trim();
      if (
        remainder.startsWith('נהוג לכתוב ') ||
        remainder.includes('קטיעא') ||
        remainder.includes('גדולה') ||
        remainder.includes('זעירא')
      ) {
        return { tradition: 'sephardi-ashkenazi', action: 'note', replacement: null };
      }

      return {
        tradition: 'sephardi-ashkenazi',
        action: 'replace',
        replacement: cleanDisplayText(remainder),
      };
    }
  }

  if (noteText.startsWith('בספרי תימן ')) {
    return { tradition: 'teimani', action: 'note', replacement: null };
  }

  if (noteText.startsWith('בכתר ארם צובה היה כתוב ')) {
    return { tradition: 'mam', action: 'note', replacement: null };
  }

  return { tradition: 'other', action: 'note', replacement: null };
}

function getMarkerContext(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) {
    return {
      precedingSegment: '',
      precedingToken: '',
      followingSegment: '',
      followingToken: '',
    };
  }

  const before = text.slice(0, markerIndex);
  const after = text.slice(markerIndex + marker.length);

  return {
    precedingSegment: before.match(/([^\s־]+)$/)?.[1] ?? '',
    precedingToken: before.match(/([^\s]+)$/)?.[1] ?? '',
    followingSegment: after.match(/^([^\s־]+)/)?.[1] ?? '',
    followingToken: after.match(/^([^\s]+)/)?.[1] ?? '',
  };
}

function applyDefaultTradition(textWithMarkers, notes, { keepPaseq = false } = {}) {
  let resolved = textWithMarkers;

  for (const note of notes) {
    const marker = noteMarker(note.i);
    const markerIndex = resolved.indexOf(marker);
    if (markerIndex === -1) {
      continue;
    }

    const before = resolved.slice(0, markerIndex);
    const after = resolved.slice(markerIndex + marker.length);

    if (note.y === DEFAULT_TRADITION && note.a === 'replace' && note.p && note.b) {
      resolved = `${before.slice(0, -note.b.length)}${note.p}${after}`;
      continue;
    }

    if (note.y === DEFAULT_TRADITION && note.a === 'remove-break') {
      resolved = `${before.replace(/\s*\{[פס]\}\s*$/, '')}${after}`;
      continue;
    }

    resolved = `${before}${after}`;
  }

  return cleanDisplayText(resolved, { keepPaseq });
}

function verseToString(verseText) {
  if (typeof verseText === 'string') {
    return verseText;
  }

  if (Array.isArray(verseText)) {
    return verseText.map((part) => verseToString(part)).filter(Boolean).join(' ');
  }

  return '';
}

function buildVerseRecord(book, chapterIndex, verseIndex, verseText, system) {
  const keepPaseq = system === 'emet';
  const { notes: extractedNotes, textWithMarkers } = extractVerseNotes(verseText);
  const cleanTextWithMarkers = cleanDisplayText(textWithMarkers, { keepPaseq });
  const notes = extractedNotes.map((note) => {
    const context = getMarkerContext(cleanTextWithMarkers, noteMarker(note.index));
    const classification = classifyNote(note.noteText);

    return {
      i: note.index,
      r: note.rawNote,
      t: note.noteText,
      y: classification.tradition,
      a: classification.action,
      p: classification.replacement,
      b: context.precedingSegment,
      bt: context.precedingToken,
      f: context.followingSegment,
      ft: context.followingToken,
    };
  });
  const baseVerseText = cleanDisplayText(cleanTextWithMarkers.replace(/\[\[FN\d+\]\]/g, ''), {
    keepPaseq,
  });
  const displayVerseText = applyDefaultTradition(cleanTextWithMarkers, notes, { keepPaseq });

  return {
    r: `${book.english} ${chapterIndex + 1}:${verseIndex + 1}`,
    b: book.english,
    h: book.hebrew,
    c: chapterIndex + 1,
    v: verseIndex + 1,
    t: displayVerseText,
    m: baseVerseText,
    n: notes,
    q: normalizeTaamim(displayVerseText, displayVerseText.lastIndexOf(METEG), system),
  };
}

const torahVerses = [];
const nachVerses = [];
const emetVerses = [];
const chapterCounts = {};

for (const book of BOOKS) {
  const inputPath = path.resolve('data/raw', `${book.english}.json`);
  const raw = JSON.parse(await readFile(inputPath, 'utf8'));
  const chapters = raw.text?.he ?? raw.text?.text ?? raw.text?.chapter ?? [];

  if (!Array.isArray(chapters)) {
    throw new Error(`Unexpected chapter structure for ${book.english}`);
  }

  chapters.forEach((chapter, chapterIndex) => {
    const versesInChapter = Array.isArray(chapter) ? chapter : [chapter];

    versesInChapter.forEach((rawVerseText, verseIndex) => {
      const verseText = verseToString(rawVerseText);
      if (!verseText.trim()) {
        return;
      }

      const record = buildVerseRecord(book, chapterIndex, verseIndex, verseText, 'torah');
      chapterCounts[book.english] = Math.max(chapterCounts[book.english] ?? 0, record.c);

      if (book.section === 'torah') {
        torahVerses.push(record);
      } else {
        nachVerses.push(record);
      }

      if (book.trop === 'emet') {
        emetVerses.push(buildVerseRecord(book, chapterIndex, verseIndex, verseText, 'emet'));
      }
    });
  });
}

await mkdir(path.resolve('data'), { recursive: true });

const booksPath = path.resolve('data/tanakh-books.json');
await writeFile(
  booksPath,
  `${JSON.stringify(
    BOOKS.map((book) => ({ ...book, chapterCount: chapterCounts[book.english] ?? 0 })),
    null,
    2,
  )}\n`,
);

const torahPath = path.resolve('data/torah-compact.json');
await writeFile(torahPath, JSON.stringify(torahVerses));
console.log(`Wrote ${torahPath} (${torahVerses.length} verses)`);

const nachPath = path.resolve('data/nach-compact.json');
await writeFile(nachPath, JSON.stringify(nachVerses));
console.log(`Wrote ${nachPath} (${nachVerses.length} verses)`);

const emetPath = path.resolve('data/emet-compact.json');
await writeFile(emetPath, JSON.stringify(emetVerses));
console.log(`Wrote ${emetPath} (${emetVerses.length} verses)`);
