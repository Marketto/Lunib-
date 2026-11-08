import { processTerm, tokenize } from './text.js';

export const LANGS = ['it', 'ru'];

// Configurazione condivisa: build dell'indice (Node) e caricamento nell'app.
export function miniSearchOptions(lang) {
  return {
    idField: 'id',
    fields: ['title', 'keywords', 'summary', 'text'],
    storeFields: [],
    tokenize: (s) => tokenize(s, lang),
    processTerm: (t) => processTerm(t, lang)
  };
}

export const SEARCH_BOOST = { title: 4, keywords: 3, summary: 1.5, text: 1 };
