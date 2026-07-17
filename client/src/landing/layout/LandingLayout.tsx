import React from "react";
import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Trust from "../components/Trust/Trust";
import Search from "../components/Search/Search";
import Events from "../components/Events/Events";
import Communities from "../components/Communities/Communities";
import Categories from "../components/Categories/Categories";
import Features from "../components/Features/Features";
import OnePlace from "../components/OnePlace/OnePlace";
import CTA from "../components/CTA/CTA";
import Footer from "../components/Footer/Footer";

export function LandingLayout() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <main>
        <Hero />
        <Trust />
        <Search />
        <Events />
        <Communities />
        <Categories />
        <Features />
        <OnePlace />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
export default LandingLayout;
