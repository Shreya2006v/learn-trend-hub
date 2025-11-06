import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisSectionProps {
  title: string;
  icon: LucideIcon;
  content: string[];
}

const AnalysisSection = ({ title, icon: Icon, content }: AnalysisSectionProps) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {content.map((item, index) => (
            <li key={index} className="flex gap-3 text-muted-foreground leading-relaxed">
              <span className="text-accent mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default AnalysisSection;
