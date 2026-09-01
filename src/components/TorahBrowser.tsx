import { useEffect, useMemo, useRef } from 'react';
import type { VerseRecord } from '../types';
import { groupBooksBySection } from '../lib/books';

type TorahBrowserProps = {
  books: Array<{ book: VerseRecord['book']; bookHebrew: string; chapters: number[] }>;
  activeBook: VerseRecord['book'];
  activeChapter: number;
  selectedRef: string | null;
  scrollRequest: { ref: string; nonce: number } | null;
  verses: VerseRecord[];
  onBookChange: (book: VerseRecord['book']) => void;
  onChapterChange: (chapter: number) => void;
  onTextSelection: (selectedText: string, ref: string) => void;
  onScrollStateChange: (shouldHideHeader: boolean) => void;
};

export function TorahBrowser({
  books,
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
  const activeBookMeta = books.find((book) => book.book === activeBook);
  const chapterOptions = activeBookMeta?.chapters ?? [];
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

  return (
    <section className="browser">
      <header className="browser__header">
        <div>
          <span className="eyebrow">Tanakh</span>
          <h2>
            <span className="browser__title-he" lang="he" dir="rtl">
              {activeBookMeta?.bookHebrew ?? activeBook}
            </span>
            <span>{activeChapter}</span>
          </h2>
        </div>
        <div className="browser__controls">
          <label className="browser__control browser__control--book">
            <span>Sefer</span>
            <select
              className="browser__select browser__select--book"
              value={activeBook}
              onChange={(event) => onBookChange(event.target.value as VerseRecord['book'])}
            >
              {bookGroups.map((group) => (
                <optgroup key={group.section} label={group.sectionLabel}>
                  {group.books.map((book) => (
                    <option key={book.book} value={book.book}>
                      {book.bookHebrew}
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
