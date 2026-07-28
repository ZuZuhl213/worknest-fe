import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500');
  });

  it('handles conditional classes properly', () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn('base-class', isTrue && 'active', isFalse && 'inactive')).toBe('base-class active');
  });

  it('resolves conflicting tailwind classes via tailwind-merge', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-red-500', 'text-green-500')).toBe('text-green-500');
  });
});
