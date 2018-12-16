import { Wordbook } from './common';

import verbaladvantage from './verbaladvantage';
import vocabulary from './vocabulary';
import oxforddictionaries from './oxforddictionaries';

export * from './common';
export const books: Wordbook[] = [vocabulary, oxforddictionaries, verbaladvantage];
