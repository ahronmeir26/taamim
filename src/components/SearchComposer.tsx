import {
  ATNACH_HAFUKH_MARK,
  ATNACH_MARK,
  DEHI_MARK,
  GALGAL_MARK,
  GERESH_MUQDAM_MARK,
  ILUY_MARK,
  MAHPAKH_MARK,
  MAHPAKH_TOKEN,
  MERCHA_MARK,
  MUNACH_MARK,
  OLE_MARK,
  PASEQ_MARK,
  PASHTA_TOKEN,
  PAZER_MARK,
  QADMA_MARK,
  QADMA_TOKEN,
  REVIA_MARK,
  SHALSHELET_MARK,
  SILLUQ_MARK,
  TARHA_MARK,
  TSINNORIT_MARK,
  YETIV_TOKEN,
  ZINOR_MARK,
  displayTaamimCharacter,
} from '../lib/hebrew';
import type { SearchCorpus } from '../types';

type SearchComposerProps = {
  corpus: SearchCorpus;
  includeNach: boolean;
  query: string;
  selectedText: string;
  onCorpusChange: (corpus: SearchCorpus) => void;
  onNachChange: (includeNach: boolean) => void;
  onQueryChange: (value: string) => void;
  onBackspace: () => void;
  onClear: () => void;
};

const TORAH_KEYS = [
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

const EMET_KEYS = [
  { label: '֥֫', value: `${OLE_MARK}${MERCHA_MARK}`, name: 'עוֹלֶה וְיוֹרֵד', position: 'compound' },
  { label: '֑', value: ATNACH_MARK, name: 'אֶתְנַח', position: 'low' },
  { label: '֗', value: REVIA_MARK, name: 'רְבִיע', position: 'high' },
  {
    label: '֝֗',
    value: `${GERESH_MUQDAM_MARK}${REVIA_MARK}`,
    name: 'רְבִיע מֻגְרָשׁ',
    position: 'compound',
  },
  { label: '֮', value: ZINOR_MARK, name: 'צִנּוֹר', position: 'high' },
  { label: '֭', value: DEHI_MARK, name: 'דְּחִי', position: 'low' },
  { label: '֡', value: PAZER_MARK, name: 'פָּזֵר', position: 'high' },
  { label: '֓', value: SHALSHELET_MARK, name: 'שַׁלְשֶׁלֶת', position: 'high' },
  {
    label: '֤׀',
    value: `${MAHPAKH_MARK}${PASEQ_MARK}`,
    name: 'מַהְפַּךְ לְגַרְמֵיהּ',
    position: 'compound',
  },
  {
    label: '֨׀',
    value: `${QADMA_MARK}${PASEQ_MARK}`,
    name: 'אַזְלָא לְגַרְמֵיהּ',
    position: 'compound',
  },
  { label: '֥', value: MERCHA_MARK, name: 'מֵרְכָא', position: 'low' },
  { label: '֣', value: MUNACH_MARK, name: 'מֻנַּח', position: 'low' },
  { label: '֫', value: OLE_MARK, name: 'עוֹלֶה', position: 'high' },
  { label: '֤', value: MAHPAKH_MARK, name: 'מַהְפַּךְ', position: 'low' },
  { label: '֨', value: QADMA_MARK, name: 'אַזְלָא', position: 'high' },
  { label: '֪', value: GALGAL_MARK, name: 'גַּלְגַּל', position: 'low' },
  { label: '֬', value: ILUY_MARK, name: 'עִלּוּי', position: 'high' },
  { label: '֘', value: TSINNORIT_MARK, name: 'צִנּוֹרִית', position: 'high' },
  { label: '֖', value: TARHA_MARK, name: 'טַרְחָא', position: 'low' },
  { label: '֢', value: ATNACH_HAFUKH_MARK, name: 'אֶתְנַח הָפוּךְ', position: 'low' },
  { label: 'ֽ', value: SILLUQ_MARK, name: 'סוֹף פָּסוּק', position: 'low' },
];

export function SearchComposer({
  corpus,
  includeNach,
  query,
  selectedText,
  onCorpusChange,
  onNachChange,
  onQueryChange,
  onBackspace,
  onClear,
}: SearchComposerProps) {
  const keys = corpus === 'emet' ? EMET_KEYS : TORAH_KEYS;
  const selectedPlaceholder =
    corpus === 'emet'
      ? 'Highlight a phrase in Sifrei Emet'
      : includeNach
        ? 'Highlight a phrase in Tanakh'
        : 'Highlight a phrase in Torah';

  return (
    <section className="composer">
      <div className="composer__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            {corpus === 'emet' ? '֫' : '֑'}
          </span>
          <div className="brand__copy">
            <p className="eyebrow">Taamim</p>
            <h1>
              {corpus === 'emet'
                ? 'Search by טעמי אמת'
                : includeNach
                  ? 'Search Tanakh by cantillation'
                  : 'Search Torah by cantillation'}
            </h1>
          </div>
        </div>
        <div className="composer__actions">
          <div className="mode-toggle" role="radiogroup" aria-label="Search mode">
            <button
              type="button"
              role="radio"
              aria-checked={corpus === 'torah'}
              className={corpus === 'torah' ? 'is-active' : undefined}
              onClick={() => onCorpusChange('torah')}
            >
              טעמי תורה
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={corpus === 'emet'}
              className={corpus === 'emet' ? 'is-active' : undefined}
              onClick={() => onCorpusChange('emet')}
            >
              טעמי אמת
            </button>
          </div>
          {corpus === 'torah' ? (
            <button
              type="button"
              className={includeNach ? 'nach-toggle is-active' : 'nach-toggle'}
              aria-pressed={includeNach}
              onClick={() => onNachChange(!includeNach)}
            >
              {includeNach ? 'Nach on' : 'Add Nach'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="composer__body">
        <div className="composer__selected-text">
          <span className="eyebrow">Selected text</span>
          <p className={selectedText ? undefined : 'is-placeholder'} dir={selectedText ? 'rtl' : undefined} lang={selectedText ? 'he' : undefined}>
            {selectedText || selectedPlaceholder}
          </p>
        </div>

        <div className="composer__sequence">
          <div className="composer__sequence-header">
            <span className="eyebrow">Sequence</span>
            <div className="composer__sequence-actions">
              <button
                type="button"
                className="sequence-action"
                aria-label="Backspace"
                title="Backspace"
                disabled={!query}
                onClick={onBackspace}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 5.5H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8.5L4 12l6.5-6.5z"
                  />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    d="M16.2 9.8l-4.4 4.4M11.8 9.8l4.4 4.4"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="sequence-action"
                aria-label="Clear"
                title="Clear"
                disabled={!query && !selectedText}
                onClick={onClear}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    d="M7 7l10 10M17 7L7 17"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="taamim-bubbles" dir="rtl" lang="he">
            {query ? (
              Array.from(query).map((mark, index) => (
                <span key={`${mark}-${index}`} className="taamim-bubble">
                  {displayTaamimCharacter(mark)}
                </span>
              ))
            ) : (
              <span className="composer__empty-sequence" dir="ltr">
                Tap a taam, or select text below
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="composer__meta composer__meta--keyboard">
        <div className="composer__keyboard-block">
          <div className="taamim-keyboard" dir="rtl">
            {keys.map((key) => (
              <button
                key={key.name}
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
