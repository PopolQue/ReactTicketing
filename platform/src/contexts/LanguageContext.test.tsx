/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageProvider, useLanguage } from './LanguageContext';
import React from 'react';


describe('LanguageContext', () => {
  it('throws error when used outside provider', () => {
    expect(() => renderHook(() => useLanguage())).toThrow('useLanguage must be used within a LanguageProvider');
  });

  it('provides default language', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('en');
  });

  it('translates simple keys', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // Assuming 'admit' exists in en dictionary
    expect(result.current.t('admit')).toBe('Admit');
  });

  it('handles missing keys', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.t('non.existent.key')).toBe('non.existent.key');
  });

  it('updates language', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => {
      result.current.setLanguage('de');
    });
    expect(result.current.language).toBe('de');
  });
});
