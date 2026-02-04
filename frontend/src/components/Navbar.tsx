import { Link } from 'react-router-dom';


export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Raghvendra<span className="cloud-text">.cloud</span> ☁️</Link>
      </div>

      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/models" className="nav-link">AI Models</Link>
        <Link to="/blog" className="nav-link">Blog</Link>
        <a href="#contact-footer" className="nav-link contact-btn">Contact</a>
      </div>
    </nav>
  );
}
