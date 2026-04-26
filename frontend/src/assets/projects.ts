export interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  demoUrl: string;
  imageUrl: string;
}

export const projects: Project[] = [
  {
    id: 1,
    title: "EU Market Strategy AI Agent",
    description: "Multi-agent EU market intelligence dashboard with regulation retrieval, strategy generation, and PDF export.",
    tags: ["LangGraph", "RAG", "Groq", "EU Compliance"],
    demoUrl: "/models/eu-market-strategy-ai",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    title: "AI Weather Dashboard",
    description: "Live weather insights dashboard with Open-Meteo data and smart signal summaries.",
    tags: ["Weather", "Open-Meteo", "Data Viz"],
    demoUrl: "/models/weather-dashboard",
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=60"
  },
];
