import { useState, useEffect, Dispatch, SetStateAction } from "react";

export function usePersistedState<T>(
  key: string,
  defaultValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        return JSON.parse(saved) as T;
      } catch {
        // Fallback for raw string values (e.g. date strings, active preset names)
        return saved as unknown as T;
      }
    }
    return typeof defaultValue === "function"
      ? (defaultValue as () => T)()
      : defaultValue;
  });

  useEffect(() => {
    if (state === undefined || state === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(
        key,
        typeof state === "string" ? state : JSON.stringify(state)
      );
    }
  }, [key, state]);

  return [state, setState];
}
