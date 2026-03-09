import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';
import Seo from '../components/Seo';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

interface BlogPostSummary {
  title: string;
  slug: string;
  date: string;
  description: string;
  excerpt: string;
  image_url?: string | null;
  external_link?: string | null;
  tags: string[];
  canonical_url: string;
}

function formatDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString();
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/posts/`)
      .then((res) => {
        setPosts(res.data);
      })
      .catch((err) => console.error('Failed to fetch blog posts:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <Seo
        title="Blog | Raghvendra.cloud"
        description="Read AI, data science, MLOps, and strategy insights published from a git-based markdown blog."
        path="/blog"
      />

      <header>
        <h1>Blogs</h1>
        <p>Technical notes, strategy write-ups, and implementation guides.</p>
      </header>

      <main>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid">
            {posts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="card blog-card-link">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ) : null}

                <div className="card-header">
                  <h3>{post.title}</h3>
                </div>

                <p className="weather-muted">{formatDate(post.date)}</p>
                <p>{post.description || post.excerpt}</p>

                {post.tags.length > 0 ? (
                  <div className="tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
