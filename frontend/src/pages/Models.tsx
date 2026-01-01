export default function Models() {
  const projects = [
    {
      id: 1,
      title: "Sentiment Analyzer",
      description: "Uses BERT to detect emotions in text.",
      tags: ["NLP", "HuggingFace", "Python"],
      demoUrl: "https://huggingface.co/spaces/your-username/sentiment-demo" 
    },
    {
      id: 2,
      title: "Titanic Survivor Predictor",
      description: "A classic ML model deployed via Streamlit.",
      tags: ["Scikit-Learn", "Tabular Data"],
      demoUrl: "#" 
    }
  ];

  return (
    <div className="container">
      <h2>My AI Models 🚀</h2>
      <div className="grid">
        {projects.map((project) => (
          <div key={project.id} className="card model-card">
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <div className="tags">
              {project.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
            {/* Opens in new tab */}
            <a href={project.demoUrl} target="_blank" rel="noreferrer">
              <button className="primary-btn">Launch Demo ↗</button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}