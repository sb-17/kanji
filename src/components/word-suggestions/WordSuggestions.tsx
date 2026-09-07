import { useEffect, useState } from "react";
import "./WordSuggestions.css";
import type { Vocab } from "../../types/vocabType";
import { useProgress } from "../../context/ProgressContext";
import { loadUserVocab, saveUserVocab } from "../../storage/userVocab";
import { extractKanji } from "../../lib/vocab";
import { suggestWords, type WordSuggestion } from "../../lib/wordSuggest";

// Pick a real word that uses this kanji, instead of typing one from memory.
// Shared by the kanji page and the last step of the guided flow — adding a word
// is one operation, so the save lives here rather than in each caller.
export default function WordSuggestions({
  char,
  onAdd,
}: {
  char: string;
  onAdd?: (word: Vocab) => void;
}) {
  const { progress } = useProgress();
  const [items, setItems] = useState<WordSuggestion[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Keys added in this sitting, so a row can report itself done without the
  // whole list reshuffling under the finger that just tapped it.
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    setItems(null);
    setFailed(false);
    // Words already in the list are excluded rather than shown as duplicates.
    const have = new Set(loadUserVocab().map((v) => v.word));
    suggestWords(char, progress, have)
      .then((s) => alive && setItems(s))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
    // `progress` only reorders the list; re-running on every status change while
    // this is open would be churn for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  const add = (s: WordSuggestion) => {
    const entry: Vocab = {
      word: s.word,
      reading: s.reading,
      meanings: s.meanings,
      kanji: extractKanji(s.word),
      addedAt: Date.now(),
    };
    // Re-read rather than trusting a snapshot: another page may have written to
    // the same store since this mounted. Prepended, like every other add path —
    // My words has no sort control, so array order is display order.
    const list = loadUserVocab();
    if (!list.some((v) => v.word === entry.word && v.reading === entry.reading)) {
      saveUserVocab([entry, ...list]);
    }
    setAdded((prev) => new Set(prev).add(s.word));
    onAdd?.(entry);
  };

  if (failed) return null;

  if (items === null) {
    return <p className="ws-status">Looking for words…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="ws-status">
        No dictionary words left for this kanji — add your own below.
      </p>
    );
  }

  return (
    <ul className="ws-list">
      {items.map((s) => (
        <li className="ws-item" key={s.word}>
          <span className="ws-text">
            <span className="ws-word" lang="ja">
              {s.word}
            </span>
            {s.reading && s.reading !== s.word && (
              <span className="ws-reading" lang="ja">
                {s.reading}
              </span>
            )}
            <span className="ws-meaning">{s.meanings.slice(0, 3).join(", ")}</span>
          </span>
          <button
            type="button"
            className="ws-add"
            onClick={() => add(s)}
            disabled={added.has(s.word)}
          >
            {added.has(s.word) ? "Added" : "Add"}
          </button>
        </li>
      ))}
    </ul>
  );
}
