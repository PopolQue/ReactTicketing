import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideButton =
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);

      if (isOutsideButton && (!menuRef.current || isOutsideMenu)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`custom-dropdown ${className}`}
      ref={dropdownRef}
      style={{ position: 'relative', width: '100%' }}
    >
      <button
        type="button"
        onClick={() => {
          if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropdownStyles({
              top: rect.bottom + window.scrollY + 8,
              left: rect.left + window.scrollX,
              width: rect.width,
            });
          }
          setIsOpen(!isOpen);
        }}
        className="input-field"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          cursor: 'pointer',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(var(--accent-rgb), 0.2)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--text-secondary)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            opacity: 0.6,
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: dropdownStyles.top,
              left: dropdownStyles.left,
              width: dropdownStyles.width,
              backgroundColor: '#111111',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              zIndex: 99999,
              overflow: 'hidden',
              animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: '8px',
                maxHeight: '250px',
                overflowY: 'auto',
              }}
            >
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      backgroundColor:
                        value === option.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: value === option.value ? 'var(--accent)' : 'var(--text)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      if (value !== option.value)
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      if (value !== option.value)
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {option.label}
                    {value === option.value && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
