import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface AutosuggestProps<T> {
  value: string;
  onChange: (value: string) => void;
  results: T[];
  onSelect: (result: T) => void;
  isLoading?: boolean;
  placeholder?: string;
  renderItem: (item: T) => React.ReactNode;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function Autosuggest<T>({
  value,
  onChange,
  results,
  onSelect,
  isLoading,
  placeholder,
  renderItem,
  onBlur,
  onFocus,
}: AutosuggestProps<T>) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          onSelect(results[activeIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }} onKeyDown={handleKeyDown}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          if (onFocus) onFocus();
        }}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
          if (onBlur) onBlur();
        }}
        className="input-field"
        placeholder={placeholder}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="autosuggest-listbox"
      />
      {isOpen && (results.length > 0 || isLoading) && (
        <ul
          id="autosuggest-listbox"
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginTop: '4px',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            maxHeight: '200px',
            overflowY: 'auto',
            padding: 0,
            listStyle: 'none',
          }}
        >
          {isLoading ? (
            <li style={{ padding: '12px', color: 'var(--text-secondary)' }}>Searching...</li>
          ) : (
            results.map((item, index) => (
              <li
                key={index}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  backgroundColor: index === activeIndex ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
              >
                {renderItem(item)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
