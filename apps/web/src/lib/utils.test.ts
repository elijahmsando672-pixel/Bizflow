import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatRelativeTime, generateSKU, slugify, truncate } from '@bizflow/utils';

describe('formatCurrency', () => {
  it('formats number as USD currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles different currency', () => {
    expect(formatCurrency(100, 'EUR')).toBe('€100.00');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('2024');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2024-06-01'));
    expect(result).toContain('2024');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for recent dates', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });
});

describe('generateSKU', () => {
  it('generates a SKU with prefix', () => {
    const sku = generateSKU('TEST');
    expect(sku).toMatch(/^TEST-/);
  });

  it('generates unique SKUs', () => {
    const sku1 = generateSKU();
    const sku2 = generateSKU();
    expect(sku1).not.toBe(sku2);
  });
});

describe('slugify', () => {
  it('converts text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('handles special characters', () => {
    expect(slugify('Hello! World?')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });
});

describe('truncate', () => {
  it('returns text if shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates text longer than limit', () => {
    expect(truncate('hello world this is long', 10)).toBe('hello worl...');
  });
});
