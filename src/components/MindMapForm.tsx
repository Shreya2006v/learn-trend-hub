import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain } from "lucide-react";

interface MindMapFormProps {
  onGenerate: (topic: string, interestArea: string, skillLevel: string) => void;
  isGenerating: boolean;
  initialTopic?: string;
}

const MindMapForm = ({ onGenerate, isGenerating, initialTopic = "" }: MindMapFormProps) => {
  const [topic, setTopic] = useState(initialTopic);
  const [interestArea, setInterestArea] = useState("");
  const [skillLevel, setSkillLevel] = useState("beginner");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(topic, interestArea, skillLevel);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-6 w-6 text-primary" />
          <CardTitle>Create Your Learning Mind Map</CardTitle>
        </div>
        <CardDescription>
          Enter a topic you want to learn and we'll create a personalized learning path for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic to Learn</Label>
            <Input
              id="topic"
              placeholder="e.g., Machine Learning, Web Development, Data Science"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest">Your Area of Interest (Optional)</Label>
            <Input
              id="interest"
              placeholder="e.g., Healthcare, Finance, Gaming"
              value={interestArea}
              onChange={(e) => setInterestArea(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Your Skill Level</Label>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating || !topic.trim()}>
            {isGenerating ? "Generating Mind Map..." : "Generate Mind Map"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MindMapForm;