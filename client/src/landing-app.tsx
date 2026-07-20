// @ts-nocheck
import React, { Fragment, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Discussions, FinalCTA, Footer, PlatformActivity } from './landing-activity';
import { initLenis } from './landing-core';
import { Groups, Events } from './landing-features';
import { Networking, Profiles } from './landing-features2';
import { Hero, Nav, TrustStrip } from './landing-hero';

/* ============================================================
   Samaagum landing — App composition + mount
   ============================================================ */
var { useEffect: useEffectApp } = React;

export function App() {
  useEffectApp(() => {
    const lenis = initLenis();
    return () => { if (lenis && lenis.destroy) lenis.destroy(); };
  }, []);
  return (
    <React.Fragment>
      <Nav />
      <Hero />
      <TrustStrip />
      <Groups />
      <Events />
      <Networking />
      <Profiles />
      <Discussions />
      <PlatformActivity />
      <FinalCTA />
      <Footer />
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

