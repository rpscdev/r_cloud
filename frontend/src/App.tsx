import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Models from './pages/Models';
import Blog from './pages/Blog'; 
import WeatherDashboard from './pages/WeatherDashboard';
import './App.css';

import Footer from './components/Footer';

function App() {
  return (
    <>
    <Router>
      <PageTracker />
      <div className="app-layout">
        <Navbar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/models" element={<Models />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/models/wether-dashbord" element={<WeatherDashboard />} />
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
