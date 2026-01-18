import { Kanji } from "./kanjiType";

export type Vocab = {
  word: string;
  reading: string;
  meanings: string[];
  kanji: Kanji[];
};
