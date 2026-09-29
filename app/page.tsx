import { FeatureCard } from "@/components/landing/feature-card";
import { featureGroups } from "@/lib/features";

export default function Home() {
  return (
    <div className="flex flex-col gap-12 py-4 sm:py-8">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Countries of the World
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover flags, maps, and quizzes — a fun way to learn geography one
          country at a time.
        </p>
      </section>

      {featureGroups.map((group) => (
        <section key={group.id}>
          <h2 className="mb-6 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
