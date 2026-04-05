import type { VerseRecord } from '../types';

type TorahBrowserProps = {
  books: Array<{ book: VerseRecord['book']; bookHebrew: string; chapters: number[] }>;
  activeBook: VerseRecord['book'];
  activeChapter: number;
  selectedRef: string | null;
  verses: VerseRecord[];
  onBookChange: (book: VerseRecord['book']) => void;
  onChapterChange: (chapter: number) => void;
  onTextSelection: (selectedText: string, ref: string) => void;
  onVerseFocus: (ref: string) => void;
};

export function TorahBrowser({
  books,
  activeBook,
  activeChapter,
  selectedRef,
  verses,
  onBookChange,
  onChapterChange,
  onTextSelection,
  onVerseFocus,
}: TorahBrowserProps) {
  const bookOptions = books;
  const chapterOptions = books.find((book) => book.book === activeBook)?.chapters ?? [];

  function handleSelection(ref: string) {
    const selectedText = window.getSelection?.()?.toString() ?? '';
    onTextSelection(selectedText, ref);
  }

  return (
    <section className="browser">
      <header className="browser__header">
        <div>
          <span className="eyebrow">Torah Text</span>
          <h2>Browse and select Hebrew words with taamim.</h2>
        </div>
        <div className="browser__controls">
          <label>
            <span>Sefer</span>
            <select value={activeBook} onChange={(event) => onBookChange(event.target.value as VerseRecord['book'])}>
              {bookOptions.map((book) => (
                <option key={book.book} value={book.book}>
                  {book.bookHebrew} · {book.book}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Perek</span>
            <select
              className="browser__chapter-select"
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

      <div className="browser__text">
        {verses.map((verse) => (
          <article key={verse.ref} className={selectedRef === verse.ref ? 'verse is-active' : 'verse'}>
            <button
              type="button"
              className="verse__number"
              onClick={() => onVerseFocus(verse.ref)}
              aria-label={`Focus ${verse.ref}`}
            >
              {verse.verse}
            </button>
            <p
              className="verse__text"
              dir="rtl"
              lang="he"
              onMouseUp={() => handleSelection(verse.ref)}
              onKeyUp={() => handleSelection(verse.ref)}
              onClick={() => onVerseFocus(verse.ref)}
            >
              {verse.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
