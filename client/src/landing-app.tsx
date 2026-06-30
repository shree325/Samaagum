// @ts-nocheck
/* ============================================================
   Samaagum landing — App composition + mount
   ============================================================ */
var { useEffect: useEffectApp } = React;

function App() {
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
