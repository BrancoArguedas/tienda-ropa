import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('solo entrega el último valor cuando el usuario deja de escribir', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: 'v' } });
    expect(result.current).toBe('v');

    rerender({ value: 've' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'ves' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('v'); // aún escribiendo: no cambia

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('ves');
  });
});
