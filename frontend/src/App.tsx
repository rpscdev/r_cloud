import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Models from './pages/Models';
import Blog from './pages/Blog'; 
import './App.css';
import GoogleAnalytics from './components/googleanalytics'; 

import Footer from './components/Footer';

function App() {
  return (
    <>
    <GoogleAnalytics />
    <Router>
      <div className="app-layout">
        <Navbar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/models" element={<Models />} />
            <Route path="/blog" element={<Blog />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
    </>
  );
}

export default App;