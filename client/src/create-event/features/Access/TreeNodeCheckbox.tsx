// @ts-nocheck
import React from 'react';

export function TreeNodeCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={el => { if (el) el.indeterminate = indeterminate; }}
      onChange={onChange}
      style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--accent-2)' }}
    />
  );
}
