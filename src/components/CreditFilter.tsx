'use client';

import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';

interface CreditFilterProps {
  /** List of available photographer names */
  options: string[];
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
}

/**
 * Autocomplete dropdown for filtering by photographer credit (dark mode).
 *
 * Implements accessible combobox pattern with:
 * - Type-ahead filtering of options
 * - Keyboard navigation (arrow keys, enter, escape)
 * - ARIA attributes for screen readers
 */
export const CreditFilter: FC<CreditFilterProps> = ({ options, value, onChange }) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter options based on input
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 10); // Show at most 10 options

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeOption = listRef.current.children[activeIndex] as HTMLElement;
      if (activeOption) {
        activeOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setActiveIndex(-1);

    // Clear selection if input is cleared
    if (!newValue) {
      onChange('');
    }
  };

  const handleSelect = (option: string) => {
    onChange(option);
    setInputValue(option);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          handleSelect(filtered[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click on option to register
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <label className="flex flex-col">
        <span className="text-sm font-medium text-gray-300">Photographer</span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="credit-listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `credit-option-${activeIndex}` : undefined
          }
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Filter by photographer..."
          className="mt-1 w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>
      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          id="credit-listbox"
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-600 bg-gray-800 shadow-lg"
        >
          {filtered.map((option, index) => (
            <li
              key={option}
              id={`credit-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === activeIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-200 hover:bg-gray-700'
              }`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
