import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
const RAW_DIR = path.resolve('data/raw');

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
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

  const preferred = candidates.find((version) =>
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
    text,
  };
}

await mkdir(RAW_DIR, { recursive: true });

for (const book of BOOKS) {
  const payload = await fetchBook(book);
  const outputPath = path.join(RAW_DIR, `${book}.json`);
  await writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outputPath}`);
}
