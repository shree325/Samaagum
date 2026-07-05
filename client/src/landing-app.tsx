// @ts-nocheck
import React, { Fragment, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Discussions, FinalCTA, Footer, PlatformActivity } from './landing-activity';
import { initLenis } from './landing-core';
import { Communities, Events } from './landing-features';
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
      <Communities />
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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
