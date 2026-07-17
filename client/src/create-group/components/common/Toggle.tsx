// @ts-nocheck
import React from 'react';

export function Toggle({ on, onClick }) { 
  return <button type="button" className={`tg ${on ? "on" : ""}`} onClick={onClick} />; 
}
