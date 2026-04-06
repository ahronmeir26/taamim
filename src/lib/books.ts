import type { TorahBook } from '../types';

const TRANSLITERATED_BOOK_NAMES: Record<TorahBook, string> = {
  Genesis: 'Bereishis',
  Exodus: 'Shemos',
  Leviticus: 'Vayikra',
  Numbers: 'Bamidbar',
  Deuteronomy: 'Devarim',
};

export function formatTorahRef(ref: string): string {
  const [book, chapter, verse] = ref.split(/[\s:]+/);
  const transliteratedBook = TRANSLITERATED_BOOK_NAMES[book as TorahBook] ?? book;

  if (!chapter || !verse) {
    return transliteratedBook;
  }

  return `${transliteratedBook} ${chapter}:${verse}`;
}
