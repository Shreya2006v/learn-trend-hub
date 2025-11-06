import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopicInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const exampleTopics = [
  "Machine Learning",
  "Blockchain",
  "Cloud Computing",
  "Cybersecurity",
  "DevOps"
];

const TopicInput = ({ value, onChange, onSubmit, isLoading }: TopicInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Enter a technology topic to analyze..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="pl-10 h-12 text-base border-border/50 focus-visible:ring-primary"
          />
        </div>
        <Button 
          onClick={onSubmit} 
          disabled={!value.trim() || isLoading}
          className="h-12 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground">Try:</span>
        {exampleTopics.map((topic) => (
          <Badge
            key={topic}
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80 transition-colors"
            onClick={() => onChange(topic)}
          >
            {topic}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default TopicInput;
