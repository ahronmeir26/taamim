import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ResultsList } from './components/ResultsList';
import { SearchComposer } from './components/SearchComposer';
import { TorahBrowser } from './components/TorahBrowser';
import { extractTaamim } from './lib/hebrew';
import type { BookSummary, SearchResult, VerseRecord } from './types';

const API_BASE = `${import.meta.env.BASE_URL}api`;

export default function App() {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [chapterVerses, setChapterVerses] = useState<VerseRecord[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [activeBook, setActiveBook] = useState<VerseRecord['book']>('Genesis');
  const [activeChapter, setActiveChapter] = useState(1);
  const [activeResult, setActiveResult] = useState<SearchResult | null>(null);
  const [focusedRef, setFocusedRef] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const chapterCache = useRef(new Map<string, VerseRecord[]>());
  const searchCache = useRef(new Map<string, SearchResult[]>());

  const searchQuery = useMemo(() => extractTaamim(query), [query]);
  const deferredResults = useDeferredValue(results);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Backspace') {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      setQuery((current) => current.slice(0, -1));
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    async function loadBooks() {
      try {
        const response = await fetch(`${API_BASE}/books`);
        if (!response.ok) {
          throw new Error(`Failed to load books: ${response.status}`);
        }

        const payload = (await response.json()) as BookSummary[];
        setBooks(payload);
        setLoadState('ready');
      } catch (error) {
        console.error(error);
        setLoadState('error');
      }
    }

    void loadBooks();
  }, []);

  useEffect(() => {
    if (loadState !== 'ready') {
      return;
    }

    async function loadChapter() {
      const cacheKey = `${activeBook}:${activeChapter}`;
      const cached = chapterCache.current.get(cacheKey);
      if (cached) {
        setChapterVerses(cached);
        if (cached.length > 0 && !focusedRef) {
          setFocusedRef(cached[0].ref);
        }
        return;
      }

      const response = await fetch(
        `${API_BASE}/chapter?book=${encodeURIComponent(activeBook)}&chapter=${activeChapter}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to load chapter: ${response.status}`);
      }

      const payload = (await response.json()) as VerseRecord[];
      chapterCache.current.set(cacheKey, payload);
      setChapterVerses(payload);
      if (payload.length > 0 && !focusedRef) {
        setFocusedRef(payload[0].ref);
      }
    }

    void loadChapter();
  }, [activeBook, activeChapter, focusedRef, loadState]);

  useEffect(() => {
    if (!debouncedSearchQuery) {
      setResults([]);
      setActiveResult(null);
      return;
    }

    const abortController = new AbortController();

    async function runSearch() {
      const cached = searchCache.current.get(debouncedSearchQuery);
      if (cached) {
        startTransition(() => {
          setResults(cached);
        });
        return;
      }

      const response = await fetch(`${API_BASE}/search?query=${encodeURIComponent(debouncedSearchQuery)}`, {
        signal: abortController.signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to search: ${response.status}`);
      }

      const payload = (await response.json()) as SearchResult[];
      searchCache.current.set(debouncedSearchQuery, payload);
      startTransition(() => {
        setResults(payload);
      });
    }

    void runSearch().catch((error: unknown) => {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error(error);
    });

    return () => {
      abortController.abort();
    };
  }, [debouncedSearchQuery]);

  function handleTextSelection(nextSelectedText: string, ref: string) {
    const verseText = chapterVerses.find((verse) => verse.ref === ref)?.text;
    setSelectedText(nextSelectedText);
    setFocusedRef(ref);
    setQuery(extractTaamim(nextSelectedText, verseText));
  }

  function handleResultSelect(result: SearchResult) {
    setActiveResult(result);
    setFocusedRef(result.ref);
    setActiveBook(result.book);
    setActiveChapter(result.chapter);
  }

  if (loadState === 'loading') {
    return (
      <main className="app-shell">
        <section className="composer">
          <p className="eyebrow">Loading</p>
          <h1>Preparing the Torah taamim index.</h1>
        </section>
      </main>
    );
  }

  if (loadState === 'error') {
    return (
      <main className="app-shell">
        <section className="composer">
          <p className="eyebrow">Load Error</p>
          <h1>The Torah index could not be loaded.</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <SearchComposer
        query={query}
        selectedText={selectedText}
        onQueryChange={setQuery}
        onBackspace={() => setQuery((current) => current.slice(0, -1))}
        onClear={() => {
          setQuery('');
          setSelectedText('');
          setActiveResult(null);
          setResults([]);
        }}
      />

      <div className="workspace">
        <TorahBrowser
          books={books}
          activeBook={activeBook}
          activeChapter={activeChapter}
          selectedRef={focusedRef}
          verses={chapterVerses}
          onBookChange={(book) => {
            setActiveBook(book);
            setActiveChapter(books.find((item) => item.book === book)?.chapters[0] ?? 1);
            setFocusedRef(null);
          }}
          onChapterChange={setActiveChapter}
          onTextSelection={handleTextSelection}
          onVerseFocus={setFocusedRef}
        />
        <ResultsList
          results={deferredResults}
          activeRef={activeResult?.ref ?? null}
          onSelect={handleResultSelect}
        />
      </div>
    </main>
  );
}
