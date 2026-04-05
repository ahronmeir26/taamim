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
  { label: '֨', value: QADMA_TOKEN, name: 'קַדְמָא' },
  { label: '֣', name: 'מֻנַּח' },
  { label: '֘', name: 'זַרְקָא' },
  { label: '֒', name: 'סְגוֹל' },
  { label: '֗', name: 'רְבִיעִי' },
  { label: '֤', value: MAHPAKH_TOKEN, name: 'מַהְפַּךְ' },
  { label: '֨', value: PASHTA_TOKEN, name: 'פַּשְׁטָא' },
  { label: '֔', name: 'זָקֵף קָטָן' },
  { label: '֕', name: 'זָקֵף גָּדוֹל' },
  { label: '֧', name: 'דַּרְגָּא' },
  { label: '֛', name: 'תְּבִיר' },
  { label: '֥', name: 'מֵרְכָא' },
  { label: '֖', name: 'טִפְחָא' },
  { label: '֑', name: 'אֶתְנַחְתָּא' },
  { label: 'ֽ', name: 'סוֹף פָּסוּק' },
  { label: '֡', name: 'פָּזֵר' },
  { label: '֩', name: 'תְּלִישָׁא קְטַנָּה' },
  { label: '֠', name: 'תְּלִישָׁא גְדוֹלָה' },
  { label: '֜', name: 'אַזְלָא גֵּרֵשׁ' },
  { label: '֞', name: 'גֵּרְשַׁיִם' },
  { label: '֚', value: YETIV_TOKEN, name: 'יְתִיב' },
  { label: '֓', name: 'שַׁלְשֶׁלֶת' },
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
        <div>
          <p className="eyebrow">Taamim Search</p>
          <h1>Search exact taamim sequences anywhere in the Torah.</h1>
        </div>
      </div>

      <div className="composer__body">
        <div className="composer__selected-text">
          <span className="eyebrow">Selected Text</span>
          <p>{selectedText || 'Select Torah words to extract their taamim sequence.'}</p>
        </div>
        <div className="composer__actions composer__actions--right">
          <button type="button" className="ghost-button" onClick={onBackspace}>
            Delete Last
          </button>
          <button type="button" className="ghost-button" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="composer__meta composer__meta--sequence">
        <div className="composer__sequence">
          <span className="eyebrow">Current Sequence</span>
          <div className="taamim-bubbles" dir="rtl" lang="he">
            {query ? (
              Array.from(query).map((mark, index) => (
                <span key={`${mark}-${index}`} className="taamim-bubble">
                  {displayTaamimCharacter(mark)}
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
                onClick={() => onQueryChange(query + (key.value ?? key.label))}
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
