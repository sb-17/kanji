export type KanjiStatus = "new" | "learning" | "known";

export type KanjiProgress = Record<string, KanjiStatus>;
