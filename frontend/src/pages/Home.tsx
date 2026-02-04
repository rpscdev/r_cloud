import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaGithub, FaLinkedin, FaKaggle, FaInstagram } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.PROD 
  ? "/api" 
  : "http://localhost:8000";

interface BlogPost {
  image_url: any;
  id: number;
  title: string;
  content: string;
  created_at?: string;
}

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const track = (name: string) => window.umami?.track(name);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/posts/`)
      .then(res => {
        setFeaturedPosts(res.data.slice(0, 4));
      })
      .catch(err => console.error("Error fetching posts:", err));
  }, []);

  return (
    <div className="home-container">
      <section className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Turning Data into Intelligence 🤖</h1>
            <p>
              Hi, I'm Raghvendra. Explore my latest AI models, 
              data pipelines, and technical deep dives.
            </p>
            <div className="hero-buttons">
              <Link to="/models" className="btn btn-primary" onClick={() => track('home:explore-models')}>
                Explore Models 🚀
              </Link>
              <a href="#contact-footer" className="btn btn-outline" onClick={() => track('home:contact')}>
                Contact Me 📩
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container">
        <div className="section-header">
          <h2>Latest Insights</h2>
          <Link to="/blog" className="view-all-link">View All Blogs →</Link>
        </div>

        <div className="blog-grid-home">
          {featuredPosts.length > 0 ? (
            featuredPosts.map((post) => (
              <Link 
                to="/blog" 
                key={post.id} 
                className="blog-card-mini"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {post.image_url && (
                  <img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="blog-mini-image" 
                  />
                )}

                <div className="blog-mini-content">
                    <h3>{post.title}</h3>
                    <p>{post.content.substring(0, 100)}...</p>
                    <span className="read-more-link">Read More →</span>
                </div>
              </Link>
            ))
          ) : (
            <p>No posts available.</p>
          )}
        </div>
      </section>

      <section className="about-section">
        <div className="about-content">
          <h2>About Me 👨‍💻</h2>
          <p>
            I am a passionate Data Scientist and Full-Stack Developer exploring the intersection of 
            AI, Cloud Computing, and Web Technologies. My goal is to build scalable AI systems 
            that solve real-world problems.
          </p>
          
          <div className="social-links">
            <a href="https://github.com/rpscdev" target="_blank" rel="noreferrer" className="social-icon github">
              <FaGithub />
            </a>
            
            <a href="https://www.linkedin.com/in/rpsingh505/" target="_blank" rel="noreferrer" className="social-icon linkedin">
              <FaLinkedin />
            </a>
            
            <a href="https://www.kaggle.com/rpschauhan505" target="_blank" rel="noreferrer" className="social-icon kaggle">
              <FaKaggle />
            </a>
            
            <a href="https://instagram.com/username" target="_blank" rel="noreferrer" className="social-icon instagram">
              <FaInstagram />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
