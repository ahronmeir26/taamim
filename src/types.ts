export type TorahBook = 'Genesis' | 'Exodus' | 'Leviticus' | 'Numbers' | 'Deuteronomy';

export type VerseNote = {
  index: number;
  rawNote: string;
  noteText: string;
  tradition: 'sephardi-ashkenazi' | 'teimani' | 'mam' | 'other';
  action: 'replace' | 'remove-break' | 'note';
  replacement: string | null;
  precedingSegment: string;
  precedingToken: string;
  followingSegment: string;
  followingToken: string;
};

export type VerseRecord = {
  ref: string;
  book: TorahBook;
  bookHebrew: string;
  chapter: number;
  verse: number;
  text: string;
  baseText: string;
  notes: VerseNote[];
};

export type SearchResult = {
  ref: string;
  book: TorahBook;
  chapter: number;
  verse: number;
  startWordIndex: number;
  endWordIndex: number;
  matchedTaamim: string;
  matchedText: string;
  contextText: string;
  baseContextText: string;
  notes: VerseNote[];
};

export type BookSummary = {
  book: TorahBook;
  bookHebrew: string;
  chapters: number[];
};
