export interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  demoUrl: string;
  imageUrl: string; // <--- New Field
}

export const projects: Project[] = [
  {
    id: 1,
    title: "Sentiment Analyzer",
    description: "Uses BERT to detect emotions in text with high accuracy.",
    tags: ["NLP", "HuggingFace", "Python"],
    demoUrl: "https://huggingface.co/spaces/your-username/sentiment-demo",
    // Placeholder image - replace with your actual screenshot URL
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&auto=format&fit=crop&q=60" 
  },
  {
    id: 2,
    title: "Titanic Survivor Predictor",
    description: "A classic ML model trained on passenger data deployed via Streamlit.",
    tags: ["Scikit-Learn", "Tabular Data"],
    demoUrl: "#",
    imageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&auto=format&fit=crop&q=60"
  },
  // You can easily add more here without touching the UI code
];