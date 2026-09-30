import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlagQuiz } from "@/components/quiz/flag-quiz";
import {
  getWorldwideQuizCountries,
  getWorldwideQuizSize,
  worldwideQuizSizes,
} from "@/lib/continent-quiz";
import {
  formatContinentQuizPrompt,
  getContinentQuizMode,
  type ContinentQuizModeId,
} from "@/lib/continent-quiz-modes";

const worldwideModes = ["which-country", "which-flag"] as const;

type WorldwideModeId = (typeof worldwideModes)[number];

type WorldwideQuizPageProps = {
  params: Promise<{ mode: string; size: string }>;
};

function getWorldwideMode(modeId: string) {
  if (!worldwideModes.includes(modeId as WorldwideModeId)) return undefined;
  return getContinentQuizMode(modeId);
}

export function generateStaticParams() {
  return worldwideModes.flatMap((mode) =>
    worldwideQuizSizes.map((size) => ({ mode, size: size.id }))
  );
}

export async function generateMetadata({
  params,
}: WorldwideQuizPageProps): Promise<Metadata> {
  const { mode: modeId, size: sizeId } = await params;
  const mode = getWorldwideMode(modeId);
  const size = getWorldwideQuizSize(sizeId);

  if (!mode || !size) {
    return { title: "Flag Quiz | Countries of the World" };
  }

  return {
    title: `${formatContinentQuizPrompt(mode.prompt, "Worldwide")} · ${size.label} | Countries of the World`,
    description: mode.description,
  };
}

export default async function WorldwideQuizModePage({
  params,
}: WorldwideQuizPageProps) {
  const { mode: modeId, size: sizeId } = await params;
  const mode = getWorldwideMode(modeId);
  const size = getWorldwideQuizSize(sizeId);

  if (!mode || !size) {
    notFound();
  }

  return (
    <FlagQuiz
      title={size.limit ? `Worldwide · ${size.label}` : "Worldwide"}
      countries={getWorldwideQuizCountries()}
      mode={quizMode(mode.id)}
      prompt={formatContinentQuizPrompt(mode.prompt, "Worldwide")}
      countryLimit={size.limit ?? undefined}
      exitHref="/"
      exitLabel="Home"
    />
  );
}

function quizMode(modeId: ContinentQuizModeId) {
  return modeId === "which-flag" ? "country-to-flag" : "flag-to-country";
}
