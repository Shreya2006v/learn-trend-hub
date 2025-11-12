import { AlertCircle, CheckCircle, TrendingDown, Building2, TrendingUp as TrendingUpIcon, Brain, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ReplacementTech {
  name: string;
  reason: string;
}

interface RelevanceData {
  status: "current" | "declining" | "outdated";
  explanation: string;
  adoptionRate: string;
  companiesUsingIt?: string[];
  practicalUsage: string;
  replacementTechnologies?: ReplacementTech[];
}

interface RelevanceCheckerProps {
  relevance: RelevanceData;
  topic: string;
}

const RelevanceChecker = ({ relevance, topic }: RelevanceCheckerProps) => {
  const navigate = useNavigate();

  const handleLearnTopic = (topicToLearn: string) => {
    navigate(`/mind-map?topic=${encodeURIComponent(topicToLearn)}`);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "current":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          badgeVariant: "default" as const,
          badgeText: "Currently Relevant"
        };
      case "declining":
        return {
          icon: TrendingDown,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
          badgeVariant: "secondary" as const,
          badgeText: "Declining Usage"
        };
      case "outdated":
        return {
          icon: AlertCircle,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          badgeVariant: "destructive" as const,
          badgeText: "Outdated Technology"
        };
      default:
        return {
          icon: CheckCircle,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
          badgeVariant: "secondary" as const,
          badgeText: "Unknown"
        };
    }
  };

  const config = getStatusConfig(relevance.status);
  const Icon = config.icon;

  return (
    <Card className={`border-2 ${config.borderColor} ${config.bgColor} transition-all duration-300 hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            Relevance Check: {topic}
          </CardTitle>
          <Badge variant={config.badgeVariant} className="shrink-0">
            {config.badgeText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-foreground leading-relaxed">
          {relevance.explanation}
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <TrendingUpIcon className="h-4 w-4" />
              Adoption & Usage
            </div>
            <p className="text-sm text-foreground pl-6">{relevance.adoptionRate}</p>
            <p className="text-sm text-muted-foreground pl-6">{relevance.practicalUsage}</p>
          </div>

          {relevance.companiesUsingIt && relevance.companiesUsingIt.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Used By
              </div>
              <ul className="space-y-1 pl-6">
                {relevance.companiesUsingIt.map((company, index) => (
                  <li key={index} className="text-sm text-foreground flex items-center gap-2">
                    <span className="text-primary">•</span>
                    {company}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {relevance.replacementTechnologies && relevance.replacementTechnologies.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {relevance.status === "outdated" ? "Modern Replacements:" : "Modern Alternatives:"}
            </h4>
            <div className="space-y-3">
              {relevance.replacementTechnologies.map((tech, index) => (
                <Card key={index} className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h5 className="font-semibold text-foreground">{tech.name}</h5>
                        <p className="text-sm text-muted-foreground">{tech.reason}</p>
                      </div>
                      <Button
                        onClick={() => handleLearnTopic(tech.name)}
                        size="sm"
                        className="gap-2 shrink-0"
                      >
                        <Brain className="h-4 w-4" />
                        Learn This
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {relevance.status === "outdated" && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleLearnTopic(topic)}
                  variant="outline"
                  className="flex-1"
                >
                  Continue with {topic}
                </Button>
              </div>
            )}
          </div>
        )}

        {relevance.status === "current" && (
          <Button
            onClick={() => handleLearnTopic(topic)}
            className="w-full gap-2"
          >
            <Brain className="h-4 w-4" />
            Start Learning {topic}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RelevanceChecker;
