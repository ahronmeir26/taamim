import { getBooks } from '../lib/corpus.mjs';
import { resolveCorpus } from '../lib/taamim.mjs';

export default async function handler(request, response) {
  response.status(200).json(await getBooks(resolveCorpus(request.query.corpus)));
}
