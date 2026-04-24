const listeners = new Set<() => void>();
export const profileEvents = {
  emit: () => listeners.forEach(fn => fn()),
  on:   (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); },
};
