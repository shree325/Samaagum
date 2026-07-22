// @ts-nocheck
import React from 'react';

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button type="button" className={`tg ${on ? 'on' : ''}`} onClick={onClick} />;
}
