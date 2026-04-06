import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchResult } from '../types';
import { formatTorahRef } from '../lib/books';
import { highlightWords } from '../lib/hebrew';

type ResultsListProps = {
  results: SearchResult[];
  activeRef: string | null;
  onSelect: (result: SearchResult) => void;
  onScrollStateChange: (shouldHideHeader: boolean) => void;
};

export function ResultsList({ results, activeRef, onSelect, onScrollStateChange }: ResultsListProps) {
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
        <h2>{results.length} exact matches</h2>
      </header>

      <div className="results__list" onScroll={handleScroll} onWheel={handleWheel}>
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
      </div>

      {results.length > visibleResults.length ? (
        <div className="results__footer">
          <p>
            Showing {visibleResults.length} of {results.length} matches
          </p>
          <button type="button" className="ghost-button" onClick={() => setVisibleCount((count) => count + 100)}>
            Show More
          </button>
        </div>
      ) : null}
    </section>
  );
}
