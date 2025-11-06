import { useState } from "react";
import { Lightbulb, Rocket, Wrench, TrendingUp, Target, GraduationCap } from "lucide-react";
import TopicInput from "@/components/TopicInput";
import AnalysisSection from "@/components/AnalysisSection";
import { toast } from "sonner";

interface AnalysisData {
  overview: string[];
  modernApplications: string[];
  importance: string[];
  skillsTools: string[];
  projectIdeas: string[];
  skillGap: string[];
}

const Index = () => {
  const [topic, setTopic] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeTopic = () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    
    // Simulate analysis - In a real app, this would call an AI API
    setTimeout(() => {
      const mockAnalysis: AnalysisData = {
        overview: [
          `${topic} is a rapidly evolving field that combines theoretical knowledge with practical applications`,
          "It plays a crucial role in modern technology infrastructure and digital transformation",
          "Used across various industries from healthcare to finance, entertainment to manufacturing"
        ],
        modernApplications: [
          "Cloud-native applications and microservices architecture",
          "AI-powered automation and intelligent systems",
          "Real-time data processing and analytics platforms",
          "IoT integration and edge computing solutions"
        ],
        importance: [
          "Enables businesses to scale efficiently and reduce operational costs",
          "Powers innovation in emerging technologies and digital products",
          "Critical for competitive advantage in the modern digital economy",
          "Drives efficiency improvements and enhanced user experiences"
        ],
        skillsTools: [
          "Core programming languages: Python, JavaScript, or relevant language",
          "Version control systems (Git) and collaborative development tools",
          "Cloud platforms: AWS, Azure, or Google Cloud",
          "Container orchestration: Docker, Kubernetes",
          "Testing frameworks and CI/CD pipelines"
        ],
        projectIdeas: [
          "Build a personal portfolio website showcasing your skills",
          "Create an automation tool for a common task in your workflow",
          "Develop a mobile-responsive web application with modern framework",
          "Contribute to open-source projects in this technology area",
          "Build a proof-of-concept demonstrating key concepts"
        ],
        skillGap: [
          "Foundation: Understanding core principles and best practices",
          "Hands-on experience with industry-standard tools and frameworks",
          "Problem-solving abilities with real-world scenarios",
          "Collaboration and communication skills for team environments",
          "Continuous learning mindset to stay current with rapid changes"
        ]
      };

      setAnalysis(mockAnalysis);
      setIsLoading(false);
      toast.success(`Analysis complete for ${topic}!`);
    }, 1500);
  };

  const sections = analysis ? [
    { title: "Topic Overview", icon: Lightbulb, content: analysis.overview },
    { title: "Modern Applications", icon: TrendingUp, content: analysis.modernApplications },
    { title: "Importance & Impact", icon: Target, content: analysis.importance },
    { title: "Skills & Tools to Learn", icon: Wrench, content: analysis.skillsTools },
    { title: "Project Ideas", icon: Rocket, content: analysis.projectIdeas },
    { title: "Skill Gap Analysis", icon: GraduationCap, content: analysis.skillGap }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tech Skill Analyzer
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover modern applications, skills needed, and project ideas for any technology topic
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <TopicInput
            value={topic}
            onChange={setTopic}
            onSubmit={analyzeTopic}
            isLoading={isLoading}
          />
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">Analyzing {topic}...</p>
          </div>
        )}

        {!isLoading && analysis && (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            {sections.map((section, index) => (
              <AnalysisSection
                key={index}
                title={section.title}
                icon={section.icon}
                content={section.content}
              />
            ))}
          </div>
        )}

        {!analysis && !isLoading && (
          <div className="text-center py-20">
            <GraduationCap className="h-20 w-20 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Ready to explore?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter any technology topic above to get a comprehensive analysis of its modern applications, 
              required skills, project ideas, and more.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 mt-20 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built to help you navigate the ever-evolving tech landscape
        </div>
      </footer>
    </div>
  );
};

export default Index;
