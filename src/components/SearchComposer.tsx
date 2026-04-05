type SearchMode = 'selection' | 'manual';

type SearchComposerProps = {
  mode: SearchMode;
  query: string;
  selectedText: string;
  onModeChange: (mode: SearchMode) => void;
  onQueryChange: (value: string) => void;
  onBackspace: () => void;
  onClear: () => void;
};

const TAAMIM_KEYS = [
  { label: '֑', name: 'אֶתְנַחְתָּא' },
  { label: '֖', name: 'טִפְחָא' },
  { label: '֣', name: 'מֻנַּח' },
  { label: '֔', name: 'זָקֵף גָּדוֹל' },
  { label: '֕', name: 'זָקֵף קָטָן' },
  { label: '֗', name: 'רְבִיעִי' },
  { label: '֘', name: 'זַרְקָא' },
  { label: '֙', name: 'פַּשְׁטָא' },
  { label: '֚', name: 'יְתִיב' },
  { label: '֜', name: 'גֵּרֵשׁ' },
  { label: '֞', name: 'גֵּרְשַׁיִם' },
  { label: '֥', name: 'מֵרְכָא' },
  { label: 'ֽ', name: 'סוֹף פָּסוּק' },
];

export function SearchComposer({
  mode,
  query,
  selectedText,
  onModeChange,
  onQueryChange,
  onBackspace,
  onClear,
}: SearchComposerProps) {
  return (
    <section className="composer">
      <div className="composer__header">
        <div>
          <p className="eyebrow">Taamim Search</p>
          <h1>Search exact taamim sequences anywhere in the Torah.</h1>
        </div>
        <div className="mode-toggle" role="tablist" aria-label="Search mode">
          <button
            type="button"
            className={mode === 'selection' ? 'is-active' : ''}
            onClick={() => onModeChange('selection')}
          >
            Selected Words
          </button>
          <button
            type="button"
            className={mode === 'manual' ? 'is-active' : ''}
            onClick={() => onModeChange('manual')}
          >
            Type Taamim
          </button>
        </div>
      </div>

      <div className="composer__body">
        <div className="composer__actions">
          <button type="button" className="ghost-button" onClick={onBackspace}>
            Delete Last
          </button>
          <button type="button" className="ghost-button" onClick={onClear}>
            Clear
          </button>
        </div>
        <div className="composer__selected-text">
          <span className="eyebrow">Selected Text</span>
          <p>{selectedText || 'Select Torah words to extract their taamim sequence.'}</p>
        </div>
      </div>

      <div className="composer__meta composer__meta--sequence">
        <div className="composer__sequence">
          <span className="eyebrow">Current Sequence</span>
          <div className="taamim-bubbles" dir="rtl" lang="he">
            {query ? (
              Array.from(query).map((mark, index) => (
                <span key={`${mark}-${index}`} className="taamim-bubble">
                  {mark}
                </span>
              ))
            ) : null}
          </div>
        </div>
      </div>

      <div className="composer__meta composer__meta--keyboard">
        <div className="composer__keyboard-block">
          <span className="eyebrow">Taamim Buttons</span>
          <div className="taamim-keyboard">
            {TAAMIM_KEYS.map((key) => (
              <button
                key={key.label}
                type="button"
                title={key.name}
                onClick={() => onQueryChange(query + key.label)}
              >
                <span className="taamim-keyboard__mark" dir="rtl" lang="he">
                  {key.label}
                </span>
                <span className="taamim-keyboard__name" dir="rtl" lang="he">
                  {key.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
