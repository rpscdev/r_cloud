import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

// --- CONFIGURATION ---
// Automatically switches URL based on where the app is running
const API_BASE_URL = import.meta.env.PROD 
  ? "/api" 
  : "http://localhost:8000";

// 1. Define the Data Shape
interface BlogPost {
  id?: number; 
  title: string;
  slug: string;
  content: string;
  created_at?: string;
}

function App() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- API FUNCTIONS ---

  const fetchPosts = () => {
    // UPDATED: Use dynamic variable instead of hardcoded string
    axios.get(`${API_BASE_URL}/posts/`)
      .then(res => {
        setPosts(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = title.toLowerCase().replace(/ /g, "-");
    const postData = { title, content, slug };

    if (editingId) {
      // Update Existing
      // UPDATED: Use dynamic variable
      axios.put(`${API_BASE_URL}/posts/${editingId}`, postData)
        .then(() => {
          resetForm();
          fetchPosts();
        });
    } else {
      // Create New
      // UPDATED: Use dynamic variable
      axios.post(`${API_BASE_URL}/posts/`, postData)
        .then(() => {
          resetForm();
          fetchPosts();
        });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this?")) {
      // UPDATED: Use dynamic variable
      axios.delete(`${API_BASE_URL}/posts/${id}`)
        .then(() => fetchPosts());
    }
  };

  const startEdit = (post: BlogPost) => {
    setTitle(post.title);
    setContent(post.content);
    setEditingId(post.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  // Load data on startup
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="container">
      <header>
        <h1>My AI Data Portfolio 🚀</h1>
        <p>A place to document my journey.</p>
      </header>

      {/* --- THE FORM --- */}
      <section className="editor-section">
        <h2>{editingId ? "Edit Post" : "New Entry"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title (e.g., Titanic Analysis)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Write your analysis here..."
            rows={5}
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          <div className="form-buttons">
            <button type="submit" className="primary-btn">
              {editingId ? "Update Post" : "Publish Post"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* --- THE LIST --- */}
      <main>
        <h2>Recent Posts</h2>
        {loading ? <p>Loading...</p> : (
          <div className="grid">
            {posts.map((post) => (
              <div key={post.id} className="card">
                <div className="card-header">
                  <h3>{post.title}</h3>
                  <div className="actions">
                    <button onClick={() => startEdit(post)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDelete(post.id!)} className="delete-btn">Delete</button>
                  </div>
                </div>
                <p>{post.content}</p>
              </div>
            ))}
            {posts.length === 0 && <p>No posts yet. Write your first one above!</p>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;