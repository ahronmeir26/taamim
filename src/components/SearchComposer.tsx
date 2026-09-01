import {
  MAHPAKH_TOKEN,
  PASHTA_TOKEN,
  QADMA_TOKEN,
  YETIV_TOKEN,
  displayTaamimCharacter,
} from '../lib/hebrew';

type SearchComposerProps = {
  query: string;
  selectedText: string;
  onQueryChange: (value: string) => void;
  onBackspace: () => void;
  onClear: () => void;
};

const TAAMIM_KEYS = [
  { label: '֨', value: QADMA_TOKEN, name: 'קַדְמָא', position: 'high' },
  { label: '֣', name: 'מֻנַּח', position: 'low' },
  { label: '֘', name: 'זַרְקָא', position: 'high' },
  { label: '֒', name: 'סְגוֹל', position: 'high' },
  { label: '֗', name: 'רְבִיעִי', position: 'high' },
  { label: '֤', value: MAHPAKH_TOKEN, name: 'מַהְפַּךְ', position: 'low' },
  { label: '֙', value: PASHTA_TOKEN, name: 'פַּשְׁטָא', position: 'high' },
  { label: '֔', name: 'זָקֵף קָטָן', position: 'high' },
  { label: '֕', name: 'זָקֵף גָּדוֹל', position: 'high' },
  { label: '֧', name: 'דַּרְגָּא', position: 'low' },
  { label: '֛', name: 'תְּבִיר', position: 'low' },
  { label: '֥', name: 'מֵרְכָא', position: 'low' },
  { label: '֖', name: 'טִפְחָא', position: 'low' },
  { label: '֑', name: 'אֶתְנַחְתָּא', position: 'low' },
  { label: 'ֽ', name: 'סוֹף פָּסוּק', position: 'low' },
  { label: '֡', name: 'פָּזֵר', position: 'high' },
  { label: '֩', name: 'תְּלִישָׁא קְטַנָּה', position: 'high' },
  { label: '֠', name: 'תְּלִישָׁא גְדוֹלָה', position: 'high' },
  { label: '֜', name: 'אַזְלָא גֵּרֵשׁ', position: 'high' },
  { label: '֞', name: 'גֵּרְשַׁיִם', position: 'high' },
  { label: '֚', value: YETIV_TOKEN, name: 'יְתִיב', position: 'yetiv' },
  { label: '֓', name: 'שַׁלְשֶׁלֶת', position: 'high' },
];

export function SearchComposer({
  query,
  selectedText,
  onQueryChange,
  onBackspace,
  onClear,
}: SearchComposerProps) {
  return (
    <section className="composer">
      <div className="composer__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            ֑
          </span>
          <div className="brand__copy">
            <p className="eyebrow">Taamim</p>
            <h1>Search Tanakh by cantillation</h1>
          </div>
        </div>
        <div className="composer__actions">
          <button type="button" className="ghost-button" onClick={onBackspace}>
            Backspace
          </button>
          <button type="button" className="ghost-button" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="composer__body">
        <div className="composer__selected-text">
          <span className="eyebrow">Selected text</span>
          <p className={selectedText ? undefined : 'is-placeholder'} dir={selectedText ? 'rtl' : undefined} lang={selectedText ? 'he' : undefined}>
            {selectedText || 'Highlight a phrase in Tanakh'}
          </p>
        </div>

        <div className="composer__sequence">
          <span className="eyebrow">Sequence</span>
          <div className="taamim-bubbles" dir="rtl" lang="he">
            {query ? (
              Array.from(query).map((mark, index) => (
                <span key={`${mark}-${index}`} className="taamim-bubble">
                  {displayTaamimCharacter(mark)}
                </span>
              ))
            ) : (
              <span className="composer__empty-sequence">Tap a taam, or select text below</span>
            )}
          </div>
        </div>
      </div>

      <div className="composer__meta composer__meta--keyboard">
        <div className="composer__keyboard-block">
          <div className="taamim-keyboard" dir="rtl">
            {TAAMIM_KEYS.map((key) => (
              <button
                key={key.label}
                type="button"
                title={key.name}
                onClick={() => onQueryChange(query + (key.value ?? key.label))}
              >
                <span
                  className={`taamim-keyboard__mark taamim-keyboard__mark--${key.position}`}
                  dir="rtl"
                  lang="he"
                >
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
