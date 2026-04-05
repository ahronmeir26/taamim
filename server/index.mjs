import express from 'express';
import path from 'node:path';
import { getBooks, getChapter, searchTaamim } from '../lib/corpus.mjs';

const PORT = Number(process.env.PORT ?? 8787);
const app = express();
const APP_BASE_PATH = '/taamim';
const API_BASE_PATH = `${APP_BASE_PATH}/api`;
const DIST_DIR = path.resolve('dist');
const searchResponseCache = new Map();

async function sendBooks(_request, response) {
  response.json(await getBooks());
}

async function sendChapter(request, response) {
  const verses = await getChapter(String(request.query.book ?? ''), Number(request.query.chapter ?? 0));
  if (!verses) {
    response.status(404).json({ error: 'Chapter not found' });
    return;
  }

  response.json(verses);
}

async function sendSearch(request, response) {
  const query = String(request.query.query ?? '');
  const cached = searchResponseCache.get(query);
  if (cached) {
    response.json(cached);
    return;
  }

  const results = await searchTaamim(query);
  searchResponseCache.set(query, results);
  response.json(results);
}

app.get('/api/books', sendBooks);
app.get(`${API_BASE_PATH}/books`, sendBooks);
app.get('/api/chapter', sendChapter);
app.get(`${API_BASE_PATH}/chapter`, sendChapter);
app.get('/api/search', sendSearch);
app.get(`${API_BASE_PATH}/search`, sendSearch);

app.use(express.static(DIST_DIR));

app.use(APP_BASE_PATH, express.static(DIST_DIR));

app.get('/{*path}', (_request, response) => {
  response.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.get(`${APP_BASE_PATH}`, (_request, response) => {
  response.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.get(`${APP_BASE_PATH}/{*path}`, (_request, response) => {
  response.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Taamim Search server listening on http://127.0.0.1:${PORT}`);
});
