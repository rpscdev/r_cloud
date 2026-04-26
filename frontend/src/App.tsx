import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Models from './pages/Models';
import Blog from './pages/Blog'; 
import BlogPost from './pages/BlogPost';
import WeatherDashboard from './pages/WeatherDashboard';
import EUMarketStrategyDashboard from './pages/EUMarketStrategyDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Impressum from './pages/Impressum';
import CookieBanner from './components/CookieBanner';
import './App.css';

import Footer from './components/Footer';

function App() {
  return (
    <>
    <Router>
      <CookieBanner />
      <PageTracker />
      <div className="app-layout">
        <Navbar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/models" element={<Models />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/models/weather-dashboard" element={<WeatherDashboard />} />
            <Route path="/models/eu-market-strategy-ai" element={<EUMarketStrategyDashboard />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/impressum" element={<Impressum />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
    </>
  );
}

function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    window.umami?.track();
  }, [location.pathname, location.search, location.hash]);

  return null;
}

export default App;
