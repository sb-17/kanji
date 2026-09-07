// Words from the bundled dictionary that use a given kanji — for the two places
// the app asks you to attach a word to a character and then hands you an empty
// text field.
//
// That ask is right (a kanji you can't use in a word isn't learned yet) but it
// is the highest-friction moment in the whole flow, and it lands exactly where
// giving up costs the most. The dictionary is already shipped; this turns typing
// a word from memory into picking one.
//
// It is ~424 KB gzipped and otherwise fetched only by the reader, so it loads on
// demand and the promise is cached: opening a second suggestion list is free.

import type { KanjiProgress } from "../types/kanjiProgress";
import { isKnownOrLearning } from "../storage/kanjiProgress";
import { extractKanji } from "./vocab";

// word → [reading, meanings]. Same shape lib/textExtract consumes.
type DictionaryData = Record<string, [string, string[]]>;

export type WordSuggestion = {
  word: string;
  reading: string;
  meanings: string[];
  // Every other kanji in it is already Learning or Known, so the word is
  // practiceable the moment this one is tagged.
  readableNow: boolean;
};

let dictPromise: Promise<DictionaryData> | null = null;

function loadDictionary(): Promise<DictionaryData> {
  dictPromise ??= import("../data/dictionary.json").then(
    // Through `unknown`: TypeScript widens the JSON's [string, string[]] pairs
    // to (string | string[])[], which won't assign to a tuple.
    (m) => m.default as unknown as DictionaryData,
  );
  return dictPromise;
}

// Kana, so a word can be told from a compound. Okurigana is the signal that
// matters here: 語る/語らう/語り are all dictionary entries and all inflections of
// one verb, and left to sort by length they bury 単語, 英語 and 物語.
const KANA = /[ぁ-んァ-ヶー]/;

// Suggestions for `char`, best first.
//
// Ranked by what the learner can actually use rather than by corpus frequency,
// which the dictionary doesn't carry. Three keys, in order:
//
//   1. every *other* kanji already started — tagging this one then makes the
//      word practiceable straight away, so this list and the availability gate
//      agree rather than offering something that stays locked;
//   2. no kana in it — compounds are what a kanji is normally met in, and a
//      single kanji plus okurigana trivially satisfies (1) (it has no other
//      kanji at all), so without this the verb forms take every slot;
//   3. shortest first, which stands in for "most common" well enough and puts
//      the kanji's own one-character word at the top when it has one.
export async function suggestWords(
  char: string,
  progress: KanjiProgress,
  exclude: ReadonlySet<string>,
  limit = 6,
): Promise<WordSuggestion[]> {
  const dict = await loadDictionary();

  const readable: WordSuggestion[] = [];
  const rest: WordSuggestion[] = [];

  // `for…in` rather than Object.entries: the dictionary is ~200k entries and
  // materialising that as an array of pairs on every open is pure waste.
  for (const word in dict) {
    if (!word.includes(char) || exclude.has(word)) continue;
    const entry = dict[word];
    if (!entry) continue;

    const others = extractKanji(word).filter((k) => k !== char);
    const readableNow = others.every((k) => isKnownOrLearning(progress[k]));
    (readableNow ? readable : rest).push({
      word,
      reading: entry[0],
      meanings: entry[1],
      readableNow,
    });
  }

  const rank = (a: WordSuggestion, b: WordSuggestion) =>
    Number(KANA.test(a.word)) - Number(KANA.test(b.word)) ||
    a.word.length - b.word.length ||
    a.word.localeCompare(b.word);

  return [...readable.sort(rank), ...rest.sort(rank)].slice(0, limit);
}
