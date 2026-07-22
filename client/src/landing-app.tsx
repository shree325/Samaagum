// @ts-nocheck
import React, { Fragment, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import LandingLayout from './landing';

export function App() {
  return (
    <React.Fragment>
      <LandingLayout />
    </React.Fragment>
  );
}

const container = document.getElementById("root");

// Reuse existing root on HMR reloads instead of calling createRoot() twice
let root = (container as any).__reactRoot;
if (!root) {
  root = ReactDOM.createRoot(container);
  (container as any).__reactRoot = root;
}
root.render(<App />);


