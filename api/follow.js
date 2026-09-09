import { getTaamimFrequencies } from '../lib/corpus.mjs';
import { resolveCorpus, resolveNach } from '../lib/taamim.mjs';

export default async function handler(request, response) {
  response.status(200).json(
    await getTaamimFrequencies(resolveCorpus(request.query.corpus), resolveNach(request.query.nach)),
  );
}
