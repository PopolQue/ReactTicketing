import { describe, it, expect, vi, beforeAll } from 'vitest';
import { CodeGenerator } from '../CodeGenerator';

describe('CodeGenerator', () => {
  beforeAll(() => {
    // Mock crypto.getRandomValues if it doesn't exist in the test environment
    if (!globalThis.crypto) {
      globalThis.crypto = {
        getRandomValues: (arr: any) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }
      } as any;
    }
  });

  it('should generate a code of default length 8', () => {
    const code = CodeGenerator.generate();
    expect(code).toBeDefined();
    expect(code.length).toBe(8);
  });

  it('should generate a code of specified length', () => {
    const code = CodeGenerator.generate(12);
    expect(code.length).toBe(12);
  });

  it('should only contain uppercase letters and numbers', () => {
    const code = CodeGenerator.generate(100);
    expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
  });

  it('should generate relatively unique codes', () => {
    const code1 = CodeGenerator.generate();
    const code2 = CodeGenerator.generate();
    expect(code1).not.toBe(code2);
  });
});
