import {
  useEffect,
  useState
} from 'react';

function useDebouncedValue<TValue>(value: TValue, delayMs: number): TValue {
  /**
   * var: value
   * type: TValue
   * desc: Live value that should be debounced.
   * var: delayMs
   * type: number
   * desc: Debounce interval in milliseconds.
   */
  const [debouncedValue, setDebouncedValue] = useState<TValue>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

export { useDebouncedValue };
