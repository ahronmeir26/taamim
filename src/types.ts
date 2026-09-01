export type TanakhBook =
  | 'Genesis'
  | 'Exodus'
  | 'Leviticus'
  | 'Numbers'
  | 'Deuteronomy'
  | 'Joshua'
  | 'Judges'
  | 'I Samuel'
  | 'II Samuel'
  | 'I Kings'
  | 'II Kings'
  | 'Isaiah'
  | 'Jeremiah'
  | 'Ezekiel'
  | 'Hosea'
  | 'Joel'
  | 'Amos'
  | 'Obadiah'
  | 'Jonah'
  | 'Micah'
  | 'Nahum'
  | 'Habakkuk'
  | 'Zephaniah'
  | 'Haggai'
  | 'Zechariah'
  | 'Malachi'
  | 'Psalms'
  | 'Proverbs'
  | 'Job'
  | 'Song of Songs'
  | 'Ruth'
  | 'Lamentations'
  | 'Ecclesiastes'
  | 'Esther'
  | 'Daniel'
  | 'Ezra'
  | 'Nehemiah'
  | 'I Chronicles'
  | 'II Chronicles';

export type SearchCorpus = 'torah' | 'emet';
export type TanakhSection = 'torah' | 'neviim' | 'ketuvim';

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
  book: TanakhBook;
  bookHebrew: string;
  chapter: number;
  verse: number;
  text: string;
  baseText: string;
  notes: VerseNote[];
};

export type SearchResult = {
  ref: string;
  book: TanakhBook;
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
  book: TanakhBook;
  bookHebrew: string;
  chapters: number[];
};
