import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchCorpus, SearchResult, TanakhBook, TanakhSection } from '../types';
import {
  formatTorahRef,
  getBookSection,
  groupBooksBySection,
  TANAKH_BOOKS,
  TANAKH_SECTIONS,
} from '../lib/books';
import { highlightWords } from '../lib/hebrew';

type SectionFilter = 'all' | TanakhSection;
type BookFilter = 'all' | TanakhBook;

const SECTION_FILTER_LABELS: Record<TanakhSection, string> = {
  torah: 'Torah',
  neviim: "Nevi'im",
  ketuvim: 'Ketuvim',
};

type ResultsListProps = {
  results: SearchResult[];
  activeRef: string | null;
  hasQuery: boolean;
  pending: boolean;
  searching?: boolean;
  searchFailed?: boolean;
  corpus: SearchCorpus;
  includeNach: boolean;
  onSelect: (result: SearchResult) => void;
  onScrollStateChange: (shouldHideHeader: boolean) => void;
};

export function ResultsList({
  results,
  activeRef,
  hasQuery,
  pending,
  searching = false,
  searchFailed = false,
  corpus,
  includeNach,
  onSelect,
  onScrollStateChange,
}: ResultsListProps) {
  const [visibleCount, setVisibleCount] = useState(100);
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [bookFilter, setBookFilter] = useState<BookFilter>('all');
  const lastScrollTop = useRef(0);

  const sectionCounts = useMemo(() => {
    const counts = new Map<TanakhSection, number>();
    for (const result of results) {
      const section = getBookSection(result.book);
      counts.set(section, (counts.get(section) ?? 0) + 1);
    }
    return counts;
  }, [results]);

  const filteredResults = useMemo(
    () =>
      results.filter((result) => {
        if (sectionFilter !== 'all' && getBookSection(result.book) !== sectionFilter) {
          return false;
        }

        if (bookFilter !== 'all' && result.book !== bookFilter) {
          return false;
        }

        return true;
      }),
    [bookFilter, results, sectionFilter],
  );

  const booksWithMatches = useMemo(() => {
    const counts = new Map<TanakhBook, number>();
    for (const result of results) {
      if (sectionFilter !== 'all' && getBookSection(result.book) !== sectionFilter) {
        continue;
      }

      counts.set(result.book, (counts.get(result.book) ?? 0) + 1);
    }

    return TANAKH_BOOKS.filter((book) => counts.has(book.english)).map((book) => ({
      book: book.english,
      label: book.transliterated,
      count: counts.get(book.english) ?? 0,
    }));
  }, [results, sectionFilter]);

  const bookGroups = useMemo(() => groupBooksBySection(booksWithMatches), [booksWithMatches]);
  const visibleResults = useMemo(
    () => filteredResults.slice(0, visibleCount),
    [filteredResults, visibleCount],
  );
  const isFiltered = sectionFilter !== 'all' || bookFilter !== 'all';
  const showFilters = hasQuery && results.length > 0;
  const showSectionFilters = showFilters && corpus === 'torah' && includeNach;

  useEffect(() => {
    setSectionFilter('all');
    setBookFilter('all');
  }, [corpus, includeNach]);

  useEffect(() => {
    if (sectionFilter !== 'all' && !results.some((result) => getBookSection(result.book) === sectionFilter)) {
      setSectionFilter('all');
    }

    if (bookFilter !== 'all' && !results.some((result) => result.book === bookFilter)) {
      setBookFilter('all');
    }
  }, [bookFilter, results, sectionFilter]);

  useEffect(() => {
    setVisibleCount(100);
    lastScrollTop.current = 0;
    onScrollStateChange(false);
  }, [filteredResults, onScrollStateChange]);

  function handleSectionChange(nextSection: SectionFilter) {
    setSectionFilter(nextSection);
    if (bookFilter !== 'all' && nextSection !== 'all' && getBookSection(bookFilter) !== nextSection) {
      setBookFilter('all');
    }
  }

  function handleBookChange(nextBook: BookFilter) {
    setBookFilter(nextBook);
    if (nextBook !== 'all' && sectionFilter !== 'all' && getBookSection(nextBook) !== sectionFilter) {
      setSectionFilter(getBookSection(nextBook));
    }
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const nextScrollTop = event.currentTarget.scrollTop;
    const delta = nextScrollTop - lastScrollTop.current;

    if (delta > 4) {
      onScrollStateChange(true);
    }

    lastScrollTop.current = nextScrollTop;
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (event.deltaY < -4 && event.currentTarget.scrollTop <= 0) {
      onScrollStateChange(false);
    }
  }

  return (
    <section className="results">
      <header className="results__header">
        <div>
          <span className="eyebrow">Matches</span>
          <h2>
            {hasQuery
              ? searching
                ? 'Searching'
                : searchFailed
                  ? 'Could not search'
                  : isFiltered
                    ? `${filteredResults.length.toLocaleString()} of ${results.length.toLocaleString()} matches`
                    : `${results.length.toLocaleString()} matches`
              : 'Start a search'}
          </h2>
        </div>
        {showFilters ? (
          <label className="browser__control results__book-filter">
            <span>Sefer</span>
            <select
              className="browser__select"
              value={bookFilter}
              onChange={(event) => handleBookChange(event.target.value as BookFilter)}
            >
              <option value="all">All sefarim</option>
              {bookGroups.length === 1
                ? bookGroups[0].books.map((book) => (
                    <option key={book.book} value={book.book}>
                      {book.label} ({book.count.toLocaleString()})
                    </option>
                  ))
                : bookGroups.map((group) => (
                    <optgroup key={group.section} label={SECTION_FILTER_LABELS[group.section]}>
                      {group.books.map((book) => (
                        <option key={book.book} value={book.book}>
                          {book.label} ({book.count.toLocaleString()})
                        </option>
                      ))}
                    </optgroup>
                  ))}
            </select>
          </label>
        ) : null}
      </header>

      {showSectionFilters ? (
        <div className="results__filters" role="radiogroup" aria-label="Filter matches by section">
          <button
            type="button"
            role="radio"
            aria-checked={sectionFilter === 'all'}
            aria-label={`All, ${results.length.toLocaleString()} matches`}
            className={sectionFilter === 'all' ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => handleSectionChange('all')}
          >
            All
            <span className="filter-chip__count">{results.length.toLocaleString()}</span>
          </button>
          {TANAKH_SECTIONS.map((section) => {
            const count = sectionCounts.get(section.section) ?? 0;
            if (count === 0) {
              return null;
            }

            return (
              <button
                key={section.section}
                type="button"
                role="radio"
                aria-checked={sectionFilter === section.section}
                className={sectionFilter === section.section ? 'filter-chip is-active' : 'filter-chip'}
                aria-label={`${SECTION_FILTER_LABELS[section.section]}, ${count.toLocaleString()} matches`}
                onClick={() => handleSectionChange(section.section)}
              >
                {SECTION_FILTER_LABELS[section.section]}
                <span className="filter-chip__count">{count.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className={pending ? 'results__list is-pending' : 'results__list'}
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {!hasQuery ? (
          <p className="results__empty">
            {corpus === 'emet'
              ? 'Highlight a phrase in Sifrei Emet, or tap taamim to search.'
              : includeNach
                ? 'Highlight a phrase in Tanakh, or tap taamim to search.'
                : 'Highlight a phrase in Torah, or tap taamim to search.'}
          </p>
        ) : searching ? (
          <p className="results__empty">Looking up this sequence.</p>
        ) : searchFailed ? (
          <p className="results__empty">Search failed. Tap the sequence again to retry.</p>
        ) : visibleResults.length === 0 ? (
          <p className="results__empty">
            {results.length > 0
              ? corpus === 'emet'
                ? 'No matches in this sefer. Choose another sefer.'
                : 'No matches in this part of Tanakh. Choose another section or sefer.'
              : 'No exact matches for this sequence. Try a shorter run of taamim.'}
          </p>
        ) : (
          <>
            {visibleResults.map((result) => (
              <button
                key={`${result.ref}-${result.startWordIndex}-${result.endWordIndex}`}
                type="button"
                className={activeRef === result.ref ? 'result is-active' : 'result'}
                onClick={() => onSelect(result)}
              >
                <div className="result__meta">
                  <strong>{formatTorahRef(result.ref)}</strong>
                </div>
                <p className="result__text" dir="rtl" lang="he">
                  {highlightWords(result.contextText, result.startWordIndex, result.endWordIndex).map(
                    (word, index) => (
                      <span key={`${result.ref}-${index}`} className={word.isMatch ? 'matched-word' : ''}>
                        {word.text}{' '}
                      </span>
                    ),
                  )}
                </p>
              </button>
            ))}
            {filteredResults.length > visibleResults.length ? (
              <div className="results__footer">
                <p>
                  Showing {visibleResults.length.toLocaleString()} of {filteredResults.length.toLocaleString()}
                </p>
                <button type="button" className="ghost-button" onClick={() => setVisibleCount((count) => count + 100)}>
                  Show more
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
