// 1. Import the data
import { projects } from '../assets/projects'; 

export default function Models() {
  return (
    <div className="container">
      <h2>My AI Models 🚀</h2>
      <div className="grid">
        {projects.map((project) => (
          <div key={project.id} className="card model-card">
            
            {/* 2. ADD IMAGE HERE */}
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

            {/* Content Container */}
            <div style={{ padding: '15px' }}>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                
                <div className="tags">
                  {project.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                <a href={project.demoUrl} target="_blank" rel="noreferrer">
                  <button className="primary-btn" style={{marginTop: '10px'}}>
                    Launch Demo ↗
                  </button>
                </a>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}