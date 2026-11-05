import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client.js';

// Runs an async loader whenever `deps` change. Ignores out-of-order responses.
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === latest.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (id === latest.current) setState((s) => ({ ...s, loading: false, error: getErrorMessage(e) }));
    }
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}
