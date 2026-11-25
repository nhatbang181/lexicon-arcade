import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Hook tải dữ liệu bất đồng bộ thống nhất cho màn khung (X11):
 * tự huỷ khi unmount, giữ trạng thái loading/lỗi rõ ràng và hỗ trợ thử lại.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const reqIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const id = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      if (!mountedRef.current || id !== reqIdRef.current) return;
      setData(result);
      setLoading(false);
    } catch (err) {
      if (!mountedRef.current || id !== reqIdRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
