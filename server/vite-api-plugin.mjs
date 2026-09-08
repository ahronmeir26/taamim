import { getBooks, getChapter, searchTaamim } from '../lib/corpus.mjs';
import { resolveCorpus, resolveNach, resolveSearchParams } from '../lib/taamim.mjs';

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

async function handleApi(request, response, next) {
  if ((request.method !== 'GET' && request.method !== 'POST') || !request.url) {
    next();
    return;
  }

  const url = new URL(request.url, 'http://127.0.0.1');
  const route = url.pathname.replace(/^\/taamim/, '');
  if (!route.startsWith('/api/')) {
    next();
    return;
  }

  const corpus = resolveCorpus(url.searchParams.get('corpus'));
  const includeNach = resolveNach(url.searchParams.get('nach'));

  if (route === '/api/books') {
    sendJson(response, 200, await getBooks(corpus, includeNach));
    return;
  }

  if (route === '/api/chapter') {
    const verses = await getChapter(
      String(url.searchParams.get('book') ?? ''),
      Number(url.searchParams.get('chapter') ?? 0),
      corpus,
    );
    if (!verses) {
      sendJson(response, 404, { error: 'Chapter not found' });
      return;
    }

    sendJson(response, 200, verses);
    return;
  }

  if (route === '/api/search') {
    const source =
      request.method === 'POST' ? await readJsonBody(request) : Object.fromEntries(url.searchParams.entries());
    const search = resolveSearchParams(source);
    sendJson(response, 200, await searchTaamim(search.query, search.corpus, search.includeNach));
    return;
  }

  next();
}

function apiMiddleware(request, response, next) {
  void handleApi(request, response, next).catch((error) => {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, 500, { error: 'Internal server error' });
    }
  });
}

export function taamimApiPlugin() {
  return {
    name: 'taamim-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware);
    },
  };
}
