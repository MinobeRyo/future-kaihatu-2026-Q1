import { useState, useEffect, useCallback } from 'react';

const CODE = 'ryom';

// モジュールレベル共有（アプリ起動中は維持）
let cachedIsDebug = false;
const listeners = new Set<(val: boolean) => void>();

function broadcast(val: boolean) {
  cachedIsDebug = val;
  listeners.forEach((l) => l(val));
}

export function useDebugMode() {
  const [isDebug, setIsDebug] = useState(cachedIsDebug);

  useEffect(() => {
    const listener = (val: boolean) => setIsDebug(val);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const tryEnable = useCallback((code: string) => {
    if (code.trim() === CODE) {
      broadcast(true);
      return true;
    }
    return false;
  }, []);

  const disable = useCallback(() => {
    broadcast(false);
  }, []);

  return { isDebug, tryEnable, disable };
}
