import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ trigger, children, className = "" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(event.target as Node);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);
      
      if (isOutsideTrigger && isOutsideMenu) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`dropdown-menu-wrapper ${className}`} style={{ position: 'relative' }}>
      <div
        ref={triggerRef}
        onClick={() => {
          if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyles({
              top: rect.bottom + window.scrollY + 8,
              right: window.innerWidth - rect.right,
              minWidth: '250px',
            });
          }
          setIsOpen(!isOpen);
        }}
        style={{ cursor: 'pointer' }}
      >
        {trigger}
      </div>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          style={{
          position: 'absolute',
          top: dropdownStyles.top,
          right: dropdownStyles.right,
          minWidth: dropdownStyles.minWidth,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          opacity: 1,
          background: 'rgb(20, 20, 20)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 99999,
          padding: '16px',
          animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {children}
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
