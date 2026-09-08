import { searchTaamim } from '../lib/corpus.mjs';
import { decodeSearchQuery, resolveCorpus, resolveNach } from '../lib/taamim.mjs';

export default async function handler(request, response) {
  const corpus = resolveCorpus(request.query.corpus);
  const includeNach = resolveNach(request.query.nach);
  const query = decodeSearchQuery(request.query.q, request.query.query);
  response.status(200).json(await searchTaamim(query, corpus, includeNach));
}
