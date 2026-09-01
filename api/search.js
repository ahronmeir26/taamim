import { searchTaamim } from '../lib/corpus.mjs';
import { resolveCorpus, resolveNach } from '../lib/taamim.mjs';

export default async function handler(request, response) {
  const corpus = resolveCorpus(request.query.corpus);
  const includeNach = resolveNach(request.query.nach);
  response.status(200).json(await searchTaamim(String(request.query.query ?? ''), corpus, includeNach));
}
