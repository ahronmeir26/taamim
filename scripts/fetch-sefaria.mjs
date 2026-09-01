import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const BOOKS = JSON.parse(await readFile(path.resolve('data/tanakh-books.json'), 'utf8'));
const RAW_DIR = path.resolve('data/raw');
const REQUEST_DELAY_MS = 400;
const MAX_ATTEMPTS = 4;
const force = process.argv.includes('--force');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJson(url) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'taamim-search/1.0 (local corpus builder)',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) {
        break;
      }

      await sleep(REQUEST_DELAY_MS * attempt);
    }
  }

  throw lastError;
}

async function pickHebrewVersion(book) {
  const versionsUrl = `https://www.sefaria.org/api/texts/versions/${encodeURIComponent(book)}`;
  const versions = await fetchJson(versionsUrl);

  const candidates = versions.filter(
    (version) =>
      version.language === 'he' ||
      version.languageFamilyName === 'hebrew' ||
      version.actualLanguage === 'he',
  );

  const preferred =
    candidates.find((version) =>
      String(version.versionTitle ?? '').toLowerCase().includes('miqra according to the masorah'),
    ) ??
    candidates.find((version) =>
      String(version.versionTitle ?? '').toLowerCase().includes('taamei hamikra'),
    );

  return preferred ?? candidates[0] ?? null;
}

async function fetchBook(book) {
  const url = new URL(`https://www.sefaria.org/api/texts/${encodeURIComponent(book)}`);
  url.searchParams.set('commentary', '0');
  url.searchParams.set('context', '0');
  url.searchParams.set('pad', '0');

  const [text, hebrewVersion] = await Promise.all([
    fetchJson(url.toString()),
    pickHebrewVersion(book),
  ]);

  return {
    book,
    selectedHebrewVersionTitle: hebrewVersion?.versionTitle ?? null,
    selectedHebrewVersionSource: hebrewVersion?.versionSource ?? null,
    text: {
      he: text.he,
    },
  };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

await mkdir(RAW_DIR, { recursive: true });

for (const book of BOOKS) {
  const outputPath = path.join(RAW_DIR, `${book.english}.json`);
  if (!force && (await fileExists(outputPath))) {
    console.log(`Skipping ${book.english} (already fetched)`);
    continue;
  }

  const payload = await fetchBook(book.english);
  const chapterCount = Array.isArray(payload.text?.he) ? payload.text.he.length : 0;
  if (chapterCount === 0) {
    throw new Error(`No Hebrew chapters returned for ${book.english}`);
  }

  await writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outputPath} (${chapterCount} chapters)`);
  await sleep(REQUEST_DELAY_MS);
}
