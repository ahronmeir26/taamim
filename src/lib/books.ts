import tanakhBooks from '../../data/tanakh-books.json';
import type { TanakhBook, TanakhSection } from '../types';

type TanakhBookRecord = {
  english: TanakhBook;
  hebrew: string;
  transliterated: string;
  section: TanakhSection;
  sectionLabel: string;
};

const BOOKS = tanakhBooks as TanakhBookRecord[];

const TRANSLITERATED_BOOK_NAMES: Record<TanakhBook, string> = Object.fromEntries(
  BOOKS.map((book) => [book.english, book.transliterated]),
) as Record<TanakhBook, string>;

const BOOK_SECTIONS: Record<TanakhBook, { section: TanakhSection; sectionLabel: string }> =
  Object.fromEntries(
    BOOKS.map((book) => [book.english, { section: book.section, sectionLabel: book.sectionLabel }]),
  ) as Record<TanakhBook, { section: TanakhSection; sectionLabel: string }>;

export function formatTanakhRef(ref: string): string {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) {
    return TRANSLITERATED_BOOK_NAMES[ref as TanakhBook] ?? ref;
  }

  const [, book, chapter, verse] = match;
  const transliteratedBook = TRANSLITERATED_BOOK_NAMES[book as TanakhBook] ?? book;
  return `${transliteratedBook} ${chapter}:${verse}`;
}

export const formatTorahRef = formatTanakhRef;

export function groupBooksBySection<T extends { book: TanakhBook }>(
  books: T[],
): Array<{ section: TanakhSection; sectionLabel: string; books: T[] }> {
  const groups: Array<{ section: TanakhSection; sectionLabel: string; books: T[] }> = [];

  for (const book of books) {
    const meta = BOOK_SECTIONS[book.book] ?? {
      section: 'ketuvim' as const,
      sectionLabel: book.book,
    };
    const lastGroup = groups.at(-1);

    if (lastGroup && lastGroup.section === meta.section) {
      lastGroup.books.push(book);
      continue;
    }

    groups.push({
      section: meta.section,
      sectionLabel: meta.sectionLabel,
      books: [book],
    });
  }

  return groups;
}
