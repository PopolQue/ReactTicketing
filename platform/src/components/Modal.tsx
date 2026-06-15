import { useLanguage } from "../contexts/LanguageContext";
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px'
}: ModalProps) {
  const {
    t
  } = useLanguage();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return createPortal(<div className="modal-overlay" style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    animation: 'fadeIn 0.2s ease'
  }} onClick={e => {
    if (e.target === e.currentTarget) onClose();
  }}>
      <div className="glass-panel" style={{
      width: '100%',
      maxWidth,
      backgroundColor: '#111111',
      borderRadius: '20px',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh'
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: title ? 'space-between' : 'flex-end',
        padding: '24px 24px 16px 24px',
        borderBottom: title ? '1px solid rgba(255,255,255,0.05)' : 'none'
      }}>
          {title && <h3 style={{
          margin: 0,
          fontSize: '1.4rem'
        }}>{title}</h3>}
          <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.05)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }} onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = 'var(--text)';
        }} onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }} aria-label={t("closeModal")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div style={{
        padding: '0 24px 24px 24px',
        overflowY: 'auto'
      }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>, document.body);
}