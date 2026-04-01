import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ClipHashtagOption } from '../features/clips/types';

type ActiveHashtagMatch = {
  start: number;
  end: number;
  query: string;
};

function findActiveHashtag(value: string, caret: number): ActiveHashtagMatch | null {
  const safeCaret = Math.max(0, Math.min(caret, value.length));
  const textBeforeCaret = value.slice(0, safeCaret);
  const hashIndex = textBeforeCaret.lastIndexOf('#');
  if (hashIndex < 0) {
    return null;
  }

  const previousChar = hashIndex > 0 ? value[hashIndex - 1] : '';
  if (previousChar && !/\s/.test(previousChar)) {
    return null;
  }

  const textAfterHash = value.slice(hashIndex + 1, safeCaret);
  if (/[^a-z0-9_]/i.test(textAfterHash)) {
    return null;
  }

  const nextWhitespaceIndex = value.slice(safeCaret).search(/\s/);
  const end = nextWhitespaceIndex === -1 ? value.length : safeCaret + nextWhitespaceIndex;
  return {
    start: hashIndex,
    end,
    query: textAfterHash.toLowerCase(),
  };
}

export function SearchBar({
  value,
  onChange,
  hashtagOptions,
}: {
  value: string;
  onChange: (value: string) => void;
  hashtagOptions: ClipHashtagOption[];
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caret, setCaret] = useState(value.length);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dismissedKey, setDismissedKey] = useState('');
  const activeHashtag = useMemo(() => findActiveHashtag(value, caret), [caret, value]);
  const activeKey = activeHashtag ? `${activeHashtag.start}:${activeHashtag.query}` : '';
  const suggestions = useMemo(() => {
    if (!activeHashtag) {
      return [];
    }

    return hashtagOptions
      .filter((option) => !activeHashtag.query || option.tag.startsWith(activeHashtag.query))
      .slice(0, 8);
  }, [activeHashtag, hashtagOptions]);
  const showSuggestions = isFocused && Boolean(activeHashtag) && dismissedKey !== activeKey && suggestions.length > 0;

  useEffect(() => {
    setCaret((current) => Math.min(current, value.length));
  }, [value]);

  useEffect(() => {
    setHighlightedIndex(0);
    setDismissedKey('');
  }, [activeKey]);

  const updateCaretFromInput = () => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    setCaret(input.selectionStart ?? input.value.length);
  };

  const applySuggestion = (tag: string) => {
    if (!activeHashtag) {
      return;
    }

    const prefix = value.slice(0, activeHashtag.start);
    const suffix = value.slice(activeHashtag.end);
    const trailingSpace = suffix.startsWith(' ') ? '' : ' ';
    const nextValue = `${prefix}#${tag}${trailingSpace}${suffix}`;
    const nextCaret = prefix.length + tag.length + 2 + trailingSpace.length;

    onChange(nextValue);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCaret, nextCaret);
      setCaret(nextCaret);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      applySuggestion(suggestions[highlightedIndex]?.tag ?? suggestions[0].tag);
      return;
    }

    if (event.key === 'Escape') {
      setDismissedKey(activeKey);
    }
  };

  return (
    <label className="search-bar">
      <input
        ref={inputRef}
        aria-label="Search clips"
        autoComplete="off"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        onClick={updateCaretFromInput}
        onFocus={() => {
          setIsFocused(true);
          updateCaretFromInput();
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={updateCaretFromInput}
        onSelect={updateCaretFromInput}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 100);
        }}
        placeholder="Search title, tags, or category"
      />
      {showSuggestions && (
        <div className="search-bar__suggestions" role="listbox" aria-label="Hashtag suggestions">
          {suggestions.map((option, index) => (
            <button
              key={option.tag}
              className={`search-bar__suggestion${index === highlightedIndex ? ' is-active' : ''}`}
              type="button"
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={(event) => {
                event.preventDefault();
                applySuggestion(option.tag);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span>{`#${option.tag}`}</span>
              <span>{option.count}</span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
