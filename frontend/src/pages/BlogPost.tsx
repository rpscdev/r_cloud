import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

interface BlogPostDetail {
  title: string;
  slug: string;
  date: string;
  description: string;
  image_url?: string | null;
  external_link?: string | null;
  tags: string[];
  canonical_url: string;
  html_content: string;
}

function formatDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString();
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Missing blog slug.');
      setLoading(false);
      return;
    }

    axios
      .get(`${API_BASE_URL}/posts/${slug}`)
      .then((res) => setPost(res.data))
      .catch(() => setError('Blog post not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container">
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container">
        <h1>Article Not Found</h1>
        <p>{error || 'Unable to load this blog post.'}</p>
        <Link to="/blog" className="view-all-link">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <Seo
        title={`${post.title} | Raghvendra.cloud Blog`}
        description={post.description}
        path={post.canonical_url || `/blog/${post.slug}`}
      />

      <article className="blog-detail-shell">
        <Link to="/blog" className="view-all-link">← Back to Blog</Link>

        <header className="blog-detail-header">
          <p className="weather-muted">{formatDate(post.date)}</p>
          <h1>{post.title}</h1>
          <p className="blog-detail-description">{post.description}</p>

          {post.tags.length > 0 ? (
            <div className="tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          ) : null}
        </header>

        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="blog-detail-hero"
            loading="lazy"
            decoding="async"
          />
        ) : null}

        <section
          className="blog-detail-content"
          dangerouslySetInnerHTML={{ __html: post.html_content }}
        />

        {post.external_link ? (
          <p>
            <a href={post.external_link} target="_blank" rel="noreferrer noopener" className="view-all-link">
              Read Full Reference ↗
            </a>
          </p>
        ) : null}
      </article>
    </div>
  );
}
