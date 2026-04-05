import { getChapter } from '../lib/corpus.mjs';

export default async function handler(request, response) {
  const book = String(request.query.book ?? '');
  const chapter = Number(request.query.chapter ?? 0);
  const verses = await getChapter(book, chapter);

  if (!verses) {
    response.status(404).json({ error: 'Chapter not found' });
    return;
  }

  response.status(200).json(verses);
}
