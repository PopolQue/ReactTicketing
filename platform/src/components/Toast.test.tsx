import React, { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from './Toast';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

const ToastConsumer = ({
  message,
  type
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
}) => {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  useEffect(() => {
    showToast(message, type);
  }, [message, type, showToast]);
  return <div>{t("consumer")}</div>;
};
describe('Toast Component', () => {
  it('renders a toast message and automatically removes it', () => {
    vi.useFakeTimers();
    render(<LanguageProvider>
      <ToastProvider>
        <ToastConsumer message="Test Success!" type="success" />
      </ToastProvider>
    </LanguageProvider>);

    // Toast should be in the document
    const toastElement = screen.getByText('Test Success!');
    expect(toastElement).toBeInTheDocument();

    // Fast forward 4 seconds
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // Toast should be removed
    expect(screen.queryByText('Test Success!')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});