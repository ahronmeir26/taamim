import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchResult } from '../types';
import { formatTorahRef } from '../lib/books';
import { highlightWords } from '../lib/hebrew';

type ResultsListProps = {
  results: SearchResult[];
  activeRef: string | null;
  hasQuery: boolean;
  pending: boolean;
  onSelect: (result: SearchResult) => void;
  onScrollStateChange: (shouldHideHeader: boolean) => void;
};

export function ResultsList({
  results,
  activeRef,
  hasQuery,
  pending,
  onSelect,
  onScrollStateChange,
}: ResultsListProps) {
  const [visibleCount, setVisibleCount] = useState(100);
  const lastScrollTop = useRef(0);
  const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);

  useEffect(() => {
    setVisibleCount(100);
    lastScrollTop.current = 0;
    onScrollStateChange(false);
  }, [onScrollStateChange, results]);

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
        <span className="eyebrow">Matches</span>
        <h2>{hasQuery ? `${results.length.toLocaleString()} matches` : 'Start a search'}</h2>
      </header>

      <div
        className={pending ? 'results__list is-pending' : 'results__list'}
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {!hasQuery ? (
          <p className="results__empty">Highlight a phrase in Tanakh, or tap taamim to search.</p>
        ) : visibleResults.length === 0 ? (
          <p className="results__empty">No exact matches for this sequence. Try a shorter run of taamim.</p>
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
            {results.length > visibleResults.length ? (
              <div className="results__footer">
                <p>
                  Showing {visibleResults.length.toLocaleString()} of {results.length.toLocaleString()}
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
