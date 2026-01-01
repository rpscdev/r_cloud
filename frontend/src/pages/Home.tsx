import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
// Import the social icons from the library we installed
import { FaGithub, FaLinkedin, FaKaggle, FaInstagram } from 'react-icons/fa';

// --- CONFIGURATION ---
// Automatically switches URL based on where the app is running
// (Production = VPS, Development = Localhost)
const API_BASE_URL = import.meta.env.PROD 
  ? "/api" 
  : "http://localhost:8000";

// Define the shape of the blog post data
interface BlogPost {
  id: number;
  title: string;
  content: string;
  created_at?: string;
}

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);

  // Fetch posts when the Home page loads
  useEffect(() => {
    // UPDATED: Use dynamic variable instead of hardcoded string
    axios.get(`${API_BASE_URL}/posts/`)
      .then(res => {
        // Take only the first 4 posts to display on the homepage
        setFeaturedPosts(res.data.slice(0, 4));
      })
      .catch(err => console.error("Error fetching posts:", err));
  }, []);

  return (
    <div className="home-container">
      
      {/* --- SECTION 1: HERO BANNER --- */}
      <section className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Turning Data into Intelligence 🤖</h1>
            <p>
              Hi, I'm Raghvendra. Explore my latest AI models, 
              data pipelines, and technical deep dives.
            </p>
            <div className="hero-buttons">
              <Link to="/models" className="btn btn-primary">Explore Models 🚀</Link>
              <Link to="/contact" className="btn btn-outline">Contact Me 📩</Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: FEATURED BLOGS --- */}
      <section className="section-container">
        <div className="section-header">
          <h2>Latest Insights</h2>
          <Link to="/blog" className="view-all-link">View All Blogs →</Link>
        </div>

        <div className="blog-grid-home">
          {featuredPosts.length > 0 ? (
            featuredPosts.map((post) => (
              <div key={post.id} className="blog-card-mini">
                <h3>{post.title}</h3>
                <p>{post.content.substring(0, 100)}...</p>
                <Link to="/blog" className="read-more">Read More</Link>
              </div>
            ))
          ) : (
            <p>No blogs published yet. Go to the Blog page to add some!</p>
          )}
        </div>
      </section>

      {/* --- SECTION 3: ABOUT ME & SOCIALS --- */}
      <section className="about-section">
        <div className="about-content">
          <h2>About Me 👨‍💻</h2>
          <p>
            I am a passionate Data Scientist and Full-Stack Developer exploring the intersection of 
            AI, Cloud Computing, and Web Technologies. My goal is to build scalable AI systems 
            that solve real-world problems.
          </p>
          
          <div className="social-links">
            {/* REPLACE 'yourusername' WITH YOUR ACTUAL PROFILE LINKS BELOW */}
            
            <a href="https://github.com/yourusername" target="_blank" rel="noreferrer" className="social-icon github">
              <FaGithub />
            </a>
            
            <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noreferrer" className="social-icon linkedin">
              <FaLinkedin />
            </a>
            
            <a href="https://kaggle.com/yourusername" target="_blank" rel="noreferrer" className="social-icon kaggle">
              <FaKaggle />
            </a>
            
            <a href="https://instagram.com/yourusername" target="_blank" rel="noreferrer" className="social-icon instagram">
              <FaInstagram />
            </a>
            
          </div>
        </div>
      </section>

    </div>
  );
}