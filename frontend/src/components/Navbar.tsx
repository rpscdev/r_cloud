import { Link } from 'react-router-dom';


export default function Navbar() {
  return (
    <nav className="navbar">
      {/* 1. The Logo (Left Side) */}
      <div className="navbar-brand">
        <Link to="/">Raghvendra<span className="cloud-text">.cloud</span> ☁️</Link>
      </div>

      {/* 2. The Links (Right Side) */}
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/models" className="nav-link">AI Models</Link>
        <Link to="/blog" className="nav-link">Blog</Link>
        <Link to="/contact" className="nav-link contact-btn">Contact</Link>
      </div>
    </nav>
  );
}