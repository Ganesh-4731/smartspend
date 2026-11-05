import { useCallback, useMemo, useState } from 'react';
import { rangeForPreset } from '../utils/dates.js';

// Shared state for pages with a period filter. `params` is only valid (both dates set) and ready for the API.
export default function useDateRange(initial = 'thisMonth') {
  const [state, setState] = useState(() => ({ preset: initial, ...rangeForPreset(initial) }));
  const onPresetChange = useCallback((preset) => setState((s) => (preset === 'custom' ? { ...s, preset } : { preset, ...rangeForPreset(preset) })), []);
  const onCustomChange = useCallback(({ from, to }) => setState({ preset: 'custom', from, to }), []);
  const params = useMemo(() => ({ from: state.from, to: state.to }), [state.from, state.to]);
  const valid = Boolean(state.from && state.to && state.from <= state.to);
  return { value: state, params, valid, onPresetChange, onCustomChange };
}
