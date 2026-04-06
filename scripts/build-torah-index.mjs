import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BOOKS = [
  { english: 'Genesis', hebrew: 'בראשית' },
  { english: 'Exodus', hebrew: 'שמות' },
  { english: 'Leviticus', hebrew: 'ויקרא' },
  { english: 'Numbers', hebrew: 'במדבר' },
  { english: 'Deuteronomy', hebrew: 'דברים' },
];

const FOOTNOTE_REGEX = /<sup class="footnote-marker">\*<\/sup><i class="footnote">\((.*?)\)<\/i>/g;
const NOTE_MARKER_PREFIX = '[[FN';
const DEFAULT_TRADITION = 'sephardi-ashkenazi';
const TAAMIM_CHAR_REGEX = /[\u0591-\u05AF\u05BF\u05C0\u05C4\u05C5]/;
const LETTER_REGEX = /[\u05D0-\u05EA]/g;
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

function normalizeWordTaamim(word, keepMetegIndex) {
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

    if (character === YETIV_MARK) {
      appendUniqueTaam(firstLetterIndex === -1 || index < firstLetterIndex ? YETIV_TOKEN : MAHPAKH_TOKEN);
      continue;
    }

    if (character === MAHPAKH_MARK) {
      appendUniqueTaam(MAHPAKH_TOKEN);
      continue;
    }

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

function normalizeTaamim(text, keepMetegIndex) {
  let searchStart = 0;

  return splitWords(text)
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

function applyDefaultTradition(textWithMarkers, notes) {
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

  return cleanDisplayText(resolved);
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
      const { notes: extractedNotes, textWithMarkers } = extractVerseNotes(verseText);
      const cleanTextWithMarkers = cleanDisplayText(textWithMarkers);
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
      const baseVerseText = cleanDisplayText(cleanTextWithMarkers.replace(/\[\[FN\d+\]\]/g, ''));
      const displayVerseText = applyDefaultTradition(cleanTextWithMarkers, notes);

      verses.push({
        r: `${book.english} ${chapterIndex + 1}:${verseIndex + 1}`,
        b: book.english,
        h: book.hebrew,
        c: chapterIndex + 1,
        v: verseIndex + 1,
        t: displayVerseText,
        m: baseVerseText,
        n: notes,
        q: normalizeTaamim(displayVerseText, displayVerseText.lastIndexOf(METEG)),
      });
    });
  });
}

const outputPath = path.resolve('data/torah-compact.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(verses));
console.log(`Wrote ${outputPath}`);
