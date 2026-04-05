import { getBooks } from '../lib/corpus.mjs';

export default async function handler(_request, response) {
  response.status(200).json(await getBooks());
}
