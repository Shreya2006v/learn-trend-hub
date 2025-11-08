import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import MindMapCanvas from "@/components/MindMapCanvas";
import MindMapForm from "@/components/MindMapForm";
import type { User } from '@supabase/supabase-js';

const MindMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get("topic");
  
  const [user, setUser] = useState<User | null>(null);
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topicParam || "");
  const [currentInterest, setCurrentInterest] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast.error("Please sign in to use mind maps");
        navigate("/auth");
      } else {
        setUser(user);
      }
    });
  }, [navigate]);

  const generateMindMap = useCallback(async (topic: string, interestArea: string, skillLevel: string) => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setCurrentTopic(topic);
    setCurrentInterest(interestArea);
    setCurrentLevel(skillLevel);

    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-map', {
        body: { topic, interestArea, skillLevel }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (data.error.includes('credits')) {
          toast.error("AI credits depleted. Please add more credits.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setMindMapData(data.mindMap);
      toast.success("Mind map generated!");
    } catch (error) {
      console.error("Error generating mind map:", error);
      toast.error("Failed to generate mind map");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const saveMindMap = async () => {
    if (!user || !mindMapData) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('mind_maps').insert({
        user_id: user.id,
        topic: currentTopic,
        interest_area: currentInterest,
        skill_level: currentLevel,
        map_data: mindMapData
      });

      if (error) throw error;
      toast.success("Mind map saved!");
    } catch (error) {
      console.error("Error saving mind map:", error);
      toast.error("Failed to save mind map");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Learning Mind Map
              </h1>
              <p className="text-sm text-muted-foreground">
                Visualize your learning path
              </p>
            </div>
          </div>
          
          {mindMapData && (
            <Button onClick={saveMindMap} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Mind Map
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!mindMapData && (
          <MindMapForm
            onGenerate={generateMindMap}
            isGenerating={isGenerating}
            initialTopic={topicParam || ""}
          />
        )}

        {isGenerating && (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating your learning mind map...</p>
          </div>
        )}

        {mindMapData && !isGenerating && (
          <MindMapCanvas data={mindMapData} />
        )}
      </main>
    </div>
  );
};

export default MindMap;