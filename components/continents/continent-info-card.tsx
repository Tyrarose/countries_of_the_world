import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContinentFlag } from "@/components/continents/continent-flag";
import type { Continent } from "@/lib/continents";
import { cn } from "@/lib/utils";

type ContinentInfoCardProps = {
  continent: Continent;
  className?: string;
};

export function ContinentInfoCard({
  continent,
  className,
}: ContinentInfoCardProps) {
  return (
    <Card
      className={cn("w-80 max-w-[calc(100vw-2rem)] shadow-lg", className)}
      role="region"
      aria-label={`Continent information for ${continent.name}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 shrink-0 overflow-hidden rounded border bg-muted">
            <ContinentFlag continent={continent} />
          </div>
          <div>
            <CardTitle>{continent.name}</CardTitle>
            <CardDescription>Continent</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{continent.description}</p>
      </CardContent>
    </Card>
  );
}
