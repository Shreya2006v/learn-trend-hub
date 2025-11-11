import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Rocket, Wrench, TrendingUp, Target, GraduationCap, Brain, LogOut, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TopicInput from "@/components/TopicInput";
import AnalysisSection from "@/components/AnalysisSection";
import RelevanceChecker from "@/components/RelevanceChecker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { User } from '@supabase/supabase-js';

interface AnalysisData {
  relevance: {
    status: "current" | "declining" | "outdated";
    explanation: string;
    replacementTechnologies?: string[];
  };
  overview: string[];
  modernApplications: string[];
  importance: string[];
  skillsTools: string[];
  projectIdeas: string[];
  skillGap: string[];
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Signed out successfully");
  };

  const openMindMap = () => {
    if (!user) {
      toast.error("Please sign in to create mind maps");
      navigate("/auth");
      return;
    }
    navigate(`/mind-map${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`);
  };

  const trackUserInterest = async (topicName: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic', topicName)
      .single();

    if (existing) {
      await supabase
        .from('user_interests')
        .update({
          search_count: existing.search_count + 1,
          last_searched_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_interests')
        .insert([{ user_id: user.id, topic: topicName }]);
    }
  };

  const analyzeTopic = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    
    if (user) {
      await trackUserInterest(topic.trim());
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-topic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: topic.trim() })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
        } else if (response.status === 402) {
          toast.error("AI credits depleted. Please add more credits to continue.");
        } else {
          toast.error(error.error || "Failed to analyze topic. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      toast.success(`Analysis complete for ${topic}!`);
    } catch (error) {
      console.error("Error analyzing topic:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Tech Skill Analyzer
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover modern applications, skills needed, and project ideas for any technology topic
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
                  <Button variant="outline" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 space-y-4">
          <TopicInput
            value={topic}
            onChange={setTopic}
            onSubmit={analyzeTopic}
            isLoading={isLoading}
          />
          
          <div className="flex justify-center gap-3">
            <Button
              onClick={openMindMap}
              variant="outline"
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              Create Learning Mind Map
            </Button>
            <Button
              onClick={() => {
                if (!user) {
                  toast.error("Please sign in to use the chatbot");
                  navigate("/auth");
                  return;
                }
                navigate("/chatbot");
              }}
              variant="outline"
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              AI Learning Assistant
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">Analyzing {topic}...</p>
          </div>
        )}

        {!isLoading && analysis && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <RelevanceChecker relevance={analysis.relevance} topic={topic} />
            
            <div className="grid md:grid-cols-2 gap-6">
              {sections.map((section, index) => (
                <AnalysisSection
                  key={index}
                  title={section.title}
                  icon={section.icon}
                  content={section.content}
                />
              ))}
            </div>
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
