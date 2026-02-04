import { projects } from '../assets/projects'; 

export default function Models() {
  const track = (name: string) => window.umami?.track(name);

  return (
    <div className="container">
      <h2>My AI Models 🚀</h2>
      <div className="grid">
        {projects.map((project) => (
          <a
            key={project.id}
            className="card model-card model-card-link"
            href={project.demoUrl}
            target={project.demoUrl.startsWith('/') ? undefined : '_blank'}
            rel={project.demoUrl.startsWith('/') ? undefined : 'noreferrer'}
            onClick={() => track(`models:open:${project.title}`)}
          >
            <div className="card-image">
                <img 
                  src={project.imageUrl} 
                  alt={project.title} 
                  style={{
                    width: '100%', 
                    height: '180px', 
                    objectFit: 'cover', 
                    borderRadius: '4px 4px 0 0'
                  }} 
                />
            </div>

            <div style={{ padding: '15px' }}>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                
                <div className="tags">
                  {project.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                <button className="primary-btn" style={{ marginTop: '10px' }}>
                  Launch Demo ↗
                </button>
            </div>

          </a>
        ))}
      </div>
    </div>
  );
}
