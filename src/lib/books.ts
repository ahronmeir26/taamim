import tanakhBooks from '../../data/tanakh-books.json';
import type { TanakhBook, TanakhSection } from '../types';

type TanakhBookRecord = {
  english: TanakhBook;
  hebrew: string;
  transliterated: string;
  section: TanakhSection;
  sectionLabel: string;
  trop?: 'prose' | 'emet';
};

const BOOKS = tanakhBooks as TanakhBookRecord[];
export const TANAKH_BOOKS = BOOKS;
const BOOK_BY_ENGLISH = Object.fromEntries(BOOKS.map((book) => [book.english, book])) as Record<
  TanakhBook,
  TanakhBookRecord
>;

export const TANAKH_SECTIONS: Array<{ section: TanakhSection; sectionLabel: string }> = [];
for (const book of BOOKS) {
  if (!TANAKH_SECTIONS.some((item) => item.section === book.section)) {
    TANAKH_SECTIONS.push({ section: book.section, sectionLabel: book.sectionLabel });
  }
}

const TRANSLITERATED_BOOK_NAMES: Record<TanakhBook, string> = Object.fromEntries(
  BOOKS.map((book) => [book.english, book.transliterated]),
) as Record<TanakhBook, string>;

const BOOK_SECTIONS: Record<TanakhBook, { section: TanakhSection; sectionLabel: string }> =
  Object.fromEntries(
    BOOKS.map((book) => [book.english, { section: book.section, sectionLabel: book.sectionLabel }]),
  ) as Record<TanakhBook, { section: TanakhSection; sectionLabel: string }>;

export function getBookSection(book: TanakhBook): TanakhSection {
  return BOOK_BY_ENGLISH[book]?.section ?? 'ketuvim';
}

export function getBookHebrew(book: TanakhBook): string {
  return BOOK_BY_ENGLISH[book]?.hebrew ?? book;
}

export function getBookTransliterated(book: TanakhBook): string {
  return BOOK_BY_ENGLISH[book]?.transliterated ?? book;
}

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
