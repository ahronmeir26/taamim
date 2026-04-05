import { searchTaamim } from '../lib/corpus.mjs';

export default async function handler(request, response) {
  response.status(200).json(await searchTaamim(String(request.query.query ?? '')));
}
