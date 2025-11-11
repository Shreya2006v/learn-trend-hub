import { AlertCircle, CheckCircle, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RelevanceData {
  status: "current" | "declining" | "outdated";
  explanation: string;
  replacementTechnologies?: string[];
}

interface RelevanceCheckerProps {
  relevance: RelevanceData;
  topic: string;
}

const RelevanceChecker = ({ relevance, topic }: RelevanceCheckerProps) => {
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
      <CardContent className="space-y-4">
        <p className="text-foreground leading-relaxed">
          {relevance.explanation}
        </p>
        
        {relevance.replacementTechnologies && relevance.replacementTechnologies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">
              {relevance.status === "outdated" ? "Replaced By:" : "Modern Alternatives:"}
            </h4>
            <ul className="space-y-2">
              {relevance.replacementTechnologies.map((tech, index) => (
                <li key={index} className="flex gap-2 text-sm">
                  <span className="text-primary mt-1">→</span>
                  <span className="text-foreground">{tech}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RelevanceChecker;
