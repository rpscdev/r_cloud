import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const API_BASE_URL = import.meta.env.PROD 
  ? "/api" 
  : "http://localhost:8000";

interface BlogPost {
  id?: number; 
  title: string;
  slug: string;
  content: string;
  image_url?: string;
  created_at?: string;
}

function App() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchPosts = () => {
    axios.get(`${API_BASE_URL}/posts/`)
      .then(res => {
        setPosts(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    axios.post(`${API_BASE_URL}/login`, formData)
      .then(res => {
        const accessToken = res.data.access_token;
        setToken(accessToken);
        localStorage.setItem('token', accessToken);
        setUsername("");
        setPassword("");
      })
      .catch(err => alert("Login Failed: " + err.message));
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = title.toLowerCase().replace(/ /g, "-");
    const postData = { title, content, slug, image_url: imageUrl };

    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    if (editingId) {
      axios.put(`${API_BASE_URL}/posts/${editingId}`, postData, config)
        .then(() => {
          resetForm();
          fetchPosts();
        })
        .catch(err => alert("Error updating: " + err.message));
    } else {
      axios.post(`${API_BASE_URL}/posts/`, postData, config)
        .then(() => {
          resetForm();
          fetchPosts();
        })
        .catch(err => alert("Error creating: " + err.message));
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this?")) {
      axios.delete(`${API_BASE_URL}/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => fetchPosts());
    }
  };

  const startEdit = (post: BlogPost) => {
    setTitle(post.title);
    setContent(post.content);
    setImageUrl(post.image_url || "");
    setEditingId(post.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageUrl("");
    setEditingId(null);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1>My AI Data Portfolio 🚀</h1>
            <p>A place to document my journey.</p>
        </div>
        
        {token && (
            <button onClick={handleLogout} style={{fontSize: '0.8rem', padding: '5px 10px'}}>
                Logout
            </button>
        )}
      </header>

      {token ? (
          <section className="editor-section">
            <h2>{editingId ? "Edit Post" : "New Entry"}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <input 
                type="text"
                placeholder="Image URL (e.g. https://imgur.com/...)"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
              <textarea
                placeholder="Content..."
                rows={5}
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
              <div className="form-buttons">
                <button type="submit" className="primary-btn">
                  {editingId ? "Update" : "Publish"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="cancel-btn">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
      ) : null}

      <main>
        <h2>Recent Posts</h2>
        {loading ? <p>Loading...</p> : (
          <div className="grid">
            {posts.map((post) => (
              <div key={post.id} className="card">
                
                {post.image_url && (
                    <img 
                        src={post.image_url} 
                        alt={post.title} 
                        style={{width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px'}} 
                    />
                )}

                <div className="card-header">
                  <h3>{post.title}</h3>
                  
                  {token && (
                      <div className="actions">
                        <button onClick={() => startEdit(post)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDelete(post.id!)} className="delete-btn">Delete</button>
                      </div>
                  )}
                </div>
                <p>{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {!token && (
          <footer style={{marginTop: '50px', borderTop: '1px solid #ddd', paddingTop: '20px'}}>
            <details>
                <summary style={{cursor: 'pointer', color: '#888'}}>Admin Login</summary>
                <form onSubmit={handleLogin} style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button type="submit">Login</button>
                </form>
            </details>
          </footer>
      )}
    </div>
  );
}

export default App;
