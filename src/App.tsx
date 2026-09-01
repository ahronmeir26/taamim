import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ResultsList } from './components/ResultsList';
import { SearchComposer } from './components/SearchComposer';
import { TorahBrowser } from './components/TorahBrowser';
import { extractTaamim } from './lib/hebrew';
import type { BookSummary, SearchResult, VerseRecord } from './types';

const API_BASE = `${import.meta.env.BASE_URL}api`;

function StatusScreen({
  title,
  copy,
  loading = false,
}: {
  title: string;
  copy: string;
  loading?: boolean;
}) {
  return (
    <main className="app-shell status-shell">
      <section className="status-card">
        <div className={loading ? 'status-mark is-loading' : 'status-mark'} aria-hidden="true">
          ֑
        </div>
        <p className="eyebrow">Taamim</p>
        <h1>{title}</h1>
        <p className="status-copy">{copy}</p>
        {loading ? <div className="status-bar" role="progressbar" aria-label="Loading" /> : null}
      </section>
    </main>
  );
}

export default function App() {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [chapterVerses, setChapterVerses] = useState<VerseRecord[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [activeBook, setActiveBook] = useState<VerseRecord['book']>('Genesis');
  const [activeChapter, setActiveChapter] = useState(1);
  const [activeResult, setActiveResult] = useState<SearchResult | null>(null);
  const [selectedSourceRef, setSelectedSourceRef] = useState<string | null>(null);
  const [scrollRequest, setScrollRequest] = useState<{ ref: string; nonce: number } | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [headerHidden, setHeaderHidden] = useState(false);
  const chapterCache = useRef(new Map<string, VerseRecord[]>());
  const searchCache = useRef(new Map<string, SearchResult[]>());

  const searchQuery = useMemo(() => extractTaamim(query), [query]);
  const deferredResults = useDeferredValue(results);
  const resultsPending = deferredResults !== results;

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
    }

    void loadChapter();
  }, [activeBook, activeChapter, loadState]);

  useEffect(() => {
    if (!debouncedSearchQuery) {
      setResults([]);
      setActiveResult(null);
      setHeaderHidden(false);
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
    if (!nextSelectedText.trim()) {
      return;
    }

    const verseText = chapterVerses.find((verse) => verse.ref === ref)?.text;
    setActiveResult(null);
    setSelectedText(nextSelectedText);
    setSelectedSourceRef(ref);
    setQuery(extractTaamim(nextSelectedText, verseText));
  }

  function handleResultSelect(result: SearchResult) {
    setActiveResult(result);
    setActiveBook(result.book);
    setActiveChapter(result.chapter);
    setScrollRequest({ ref: result.ref, nonce: Date.now() });
  }

  if (loadState === 'loading') {
    return <StatusScreen loading title="Preparing the Tanakh index" copy="Loading books, chapters, and taamim." />;
  }

  if (loadState === 'error') {
    return (
      <StatusScreen title="Could not load the Tanakh index" copy="Check that the local API is running, then refresh." />
    );
  }

  return (
    <main className="app-shell">
      <div className={headerHidden ? 'composer-shell is-hidden' : 'composer-shell'}>
        <SearchComposer
          query={query}
          selectedText={selectedText}
          onQueryChange={setQuery}
          onBackspace={() => setQuery((current) => current.slice(0, -1))}
          onClear={() => {
            setQuery('');
            setSelectedText('');
            setActiveResult(null);
            setSelectedSourceRef(null);
            setScrollRequest(null);
            setHeaderHidden(false);
            setResults([]);
          }}
        />
      </div>

      <div className="mobile-swipe-hint" aria-hidden="true">
        Swipe between text and matches
      </div>

      <div className="workspace">
        <TorahBrowser
          books={books}
          activeBook={activeBook}
          activeChapter={activeChapter}
          selectedRef={activeResult?.ref ?? selectedSourceRef}
          scrollRequest={scrollRequest}
          verses={chapterVerses}
          onBookChange={(book) => {
            setActiveBook(book);
            setActiveChapter(books.find((item) => item.book === book)?.chapters[0] ?? 1);
            setActiveResult(null);
            setSelectedSourceRef(null);
            setScrollRequest(null);
          }}
          onChapterChange={setActiveChapter}
          onTextSelection={handleTextSelection}
          onScrollStateChange={setHeaderHidden}
        />
        <ResultsList
          results={deferredResults}
          activeRef={activeResult?.ref ?? null}
          hasQuery={Boolean(debouncedSearchQuery)}
          pending={resultsPending}
          onSelect={handleResultSelect}
          onScrollStateChange={setHeaderHidden}
        />
      </div>
    </main>
  );
}
