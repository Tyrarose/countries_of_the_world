import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Feature } from "@/lib/features";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  feature: Feature;
};

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;
  const isAvailable = feature.status === "available";
  const options = feature.options ?? [];

  const card = (
    <Card
      className={cn(
        "h-full transition-all duration-200",
        options.length === 0 &&
          "hover:ring-foreground/20 hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <Badge variant={isAvailable ? "default" : "secondary"}>
            {isAvailable ? "Available" : "Coming soon"}
          </Badge>
        </div>
        <CardTitle className="text-lg">{feature.title} </CardTitle>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {options.length > 0 ? (
          <ul className="grid grid-cols-2 gap-1.5">
            {options.map((option) => (
              <li key={option.id}>
                {option.href ? (
                  <Link
                    href={option.href}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "h-auto min-h-8 w-full whitespace-normal px-2 py-1.5 text-center text-xs"
                    )}
                  >
                    {option.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "h-auto min-h-8 w-full whitespace-normal px-2 py-1.5 text-center text-xs opacity-60"
                    )}
                  >
                    {option.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
            {feature.cta ?? (isAvailable ? "Explore" : "Preview")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </CardContent>
    </Card>
  );

  if (options.length > 0) {
    return card;
  }

  return (
    <Link href={feature.href} className="group block h-full">
      {card}
    </Link>
  );
}
