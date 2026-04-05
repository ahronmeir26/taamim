export type TorahBook = 'Genesis' | 'Exodus' | 'Leviticus' | 'Numbers' | 'Deuteronomy';

export type VerseRecord = {
  ref: string;
  book: TorahBook;
  bookHebrew: string;
  chapter: number;
  verse: number;
  text: string;
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
};

export type BookSummary = {
  book: TorahBook;
  bookHebrew: string;
  chapters: number[];
};
