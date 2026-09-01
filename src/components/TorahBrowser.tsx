import { useEffect, useMemo, useRef } from 'react';
import type { SearchCorpus, VerseRecord } from '../types';
import { getBookHebrew, getBookTransliterated, groupBooksBySection } from '../lib/books';

type TorahBrowserProps = {
  books: Array<{ book: VerseRecord['book']; bookHebrew: string; chapters: number[] }>;
  corpus: SearchCorpus;
  activeBook: VerseRecord['book'];
  activeChapter: number;
  selectedRef: string | null;
  scrollRequest: { ref: string; nonce: number } | null;
  verses: VerseRecord[];
  onBookChange: (book: VerseRecord['book'], chapter?: number) => void;
  onChapterChange: (chapter: number) => void;
  onTextSelection: (selectedText: string, ref: string) => void;
  onScrollStateChange: (shouldHideHeader: boolean) => void;
};

export function TorahBrowser({
  books,
  corpus,
  activeBook,
  activeChapter,
  selectedRef,
  scrollRequest,
  verses,
  onBookChange,
  onChapterChange,
  onTextSelection,
  onScrollStateChange,
}: TorahBrowserProps) {
  const bookOptions = books;
  const bookGroups = useMemo(() => groupBooksBySection(bookOptions), [bookOptions]);
  const bookIndex = books.findIndex((book) => book.book === activeBook);
  const activeBookMeta = books[bookIndex];
  const chapterOptions = activeBookMeta?.chapters ?? [];
  const chapterIndex = chapterOptions.indexOf(activeChapter);
  const canGoPrev = bookIndex > 0 || chapterIndex > 0;
  const canGoNext =
    bookIndex < books.length - 1 || (chapterIndex >= 0 && chapterIndex < chapterOptions.length - 1);
  const locationLabel = `${getBookTransliterated(activeBook)} ${activeChapter}`;
  const verseRefs = useRef(new Map<string, HTMLElement>());
  const lastScrollTop = useRef(0);

  useEffect(() => {
    if (!scrollRequest) {
      return;
    }

    const verseElement = verseRefs.current.get(scrollRequest.ref);
    if (!verseElement) {
      return;
    }

    verseElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [scrollRequest, verses]);

  function handleSelection(ref: string) {
    const selectedText = window.getSelection?.()?.toString() ?? '';
    onTextSelection(selectedText, ref);
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

  function goToAdjacentChapter(direction: -1 | 1) {
    const nextChapterIndex = chapterIndex + direction;
    if (nextChapterIndex >= 0 && nextChapterIndex < chapterOptions.length) {
      onChapterChange(chapterOptions[nextChapterIndex]);
      return;
    }

    const adjacentBook = books[bookIndex + direction];
    if (!adjacentBook) {
      return;
    }

    const nextChapter =
      direction === 1
        ? (adjacentBook.chapters[0] ?? 1)
        : (adjacentBook.chapters.at(-1) ?? 1);
    onBookChange(adjacentBook.book, nextChapter);
  }

  return (
    <section className="browser">
      <header className="browser__header">
        <div className="browser__heading">
          <span className="eyebrow">{corpus === 'emet' ? 'Sifrei Emet' : 'Tanakh'}</span>
          <h2 className="browser__hebrew" dir="rtl" lang="he">
            {getBookHebrew(activeBook)}
          </h2>
        </div>
        <div className="browser__location">
          <button
            type="button"
            className="browser__step"
            aria-label="Previous chapter"
            disabled={!canGoPrev}
            onClick={() => goToAdjacentChapter(-1)}
          >
            <ChevronIcon direction="prev" />
          </button>
          <div className="browser__controls">
            <label className="browser__control browser__control--book">
              <span>Sefer</span>
              <select
                className="browser__select browser__select--book"
                value={activeBook}
                aria-label={`Sefer, ${locationLabel}`}
                onChange={(event) => onBookChange(event.target.value as VerseRecord['book'])}
              >
                {bookGroups.map((group) => (
                  <optgroup key={group.section} label={group.sectionLabel}>
                    {group.books.map((book) => (
                      <option key={book.book} value={book.book}>
                        {getBookTransliterated(book.book)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="browser__control browser__control--chapter">
              <span>Perek</span>
              <select
                className="browser__select browser__select--chapter"
                value={activeChapter}
                aria-label={`Perek ${activeChapter}`}
                onChange={(event) => onChapterChange(Number(event.target.value))}
              >
                {chapterOptions.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="browser__step"
            aria-label="Next chapter"
            disabled={!canGoNext}
            onClick={() => goToAdjacentChapter(1)}
          >
            <ChevronIcon direction="next" />
          </button>
        </div>
      </header>

      <div className="browser__instruction">
        Highlight any word or phrase. Its taamim sequence is searched automatically.
      </div>

      <div className="browser__text" onScroll={handleScroll} onWheel={handleWheel}>
        {verses.map((verse) => (
          <article
            key={verse.ref}
            ref={(element) => {
              if (element) {
                verseRefs.current.set(verse.ref, element);
                return;
              }

              verseRefs.current.delete(verse.ref);
            }}
            className={selectedRef === verse.ref ? 'verse is-active' : 'verse'}
          >
            <span className="verse__number" aria-hidden="true">
              {verse.verse}
            </span>
            <p
              className="verse__text"
              dir="rtl"
              lang="he"
              onMouseUp={() => handleSelection(verse.ref)}
              onKeyUp={() => handleSelection(verse.ref)}
            >
              {verse.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ChevronIcon({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d={direction === 'prev' ? 'M10.2 3.2 5.4 8l4.8 4.8' : 'M5.8 3.2 10.6 8 5.8 12.8'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
