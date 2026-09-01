import { searchTaamim } from '../lib/corpus.mjs';
import { resolveCorpus } from '../lib/taamim.mjs';

export default async function handler(request, response) {
  const corpus = resolveCorpus(request.query.corpus);
  response.status(200).json(await searchTaamim(String(request.query.query ?? ''), corpus));
}
