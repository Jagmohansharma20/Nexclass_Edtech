import React from 'react'
import Navbar from '../common/navbar'
import HeroSection from '../common/HeroSection';
import Features from '../common/Features';
import Workflow from '../common/Workflow';
import Footer from '../common/Footer';
function Home() {
  return (
    <div class="home">
        <Navbar/>
        <HeroSection/>
        <Features/>
        <Workflow/>
        <Footer/>

    </div>
  )
}

export default Home;