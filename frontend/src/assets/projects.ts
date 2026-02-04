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
    title: "AI Weather Dashboard",
    description: "Live weather insights dashboard with Open-Meteo data and smart signal summaries.",
    tags: ["Weather", "Open-Meteo", "Data Viz"],
    demoUrl: "/models/wether-dashbord",
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=60"
  },
];
