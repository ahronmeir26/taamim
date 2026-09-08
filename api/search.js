import { searchTaamim } from '../lib/corpus.mjs';
import { resolveSearchParams } from '../lib/taamim.mjs';

function readRequestSource(request) {
  if (request.method !== 'POST') {
    return request.query ?? {};
  }

  const body = request.body;
  if (body == null || body === '') {
    return {};
  }

  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) {
    return JSON.parse(body.toString('utf8') || '{}');
  }

  return body;
}

export default async function handler(request, response) {
  const { query, corpus, includeNach } = resolveSearchParams(readRequestSource(request));
  response.status(200).json(await searchTaamim(query, corpus, includeNach));
}
