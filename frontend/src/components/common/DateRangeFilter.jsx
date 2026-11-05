import { PRESETS } from '../../utils/dates.js';

// Controlled by the parent: value = { preset, from, to }
export default function DateRangeFilter({ value, onPresetChange, onCustomChange }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div>
        <label htmlFor="range-preset" className="label">Period</label>
        <select id="range-preset" className="input sm:w-48" value={value.preset} onChange={(e) => onPresetChange(e.target.value)}>
          {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      {value.preset === 'custom' && (
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="range-from" className="label">From</label>
            <input id="range-from" type="date" className="input" value={value.from} max={value.to || undefined} onChange={(e) => onCustomChange({ from: e.target.value, to: value.to })} />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="range-to" className="label">To</label>
            <input id="range-to" type="date" className="input" value={value.to} min={value.from || undefined} onChange={(e) => onCustomChange({ from: value.from, to: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}
