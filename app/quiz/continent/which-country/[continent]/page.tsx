import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlagQuiz } from "@/components/quiz/flag-quiz";
import { getPlayableContinents, getPlayableQuiz } from "@/lib/continent-quiz";
import {
  formatContinentQuizPrompt,
  getContinentQuizMode,
} from "@/lib/continent-quiz-modes";

const mode = getContinentQuizMode("which-country");

type ContinentQuizPageProps = {
  params: Promise<{ continent: string }>;
};

export function generateStaticParams() {
  return getPlayableContinents().map((continent) => ({
    continent: continent.id,
  }));
}

export async function generateMetadata({
  params,
}: ContinentQuizPageProps): Promise<Metadata> {
  const { continent: continentId } = await params;
  const quiz = getPlayableQuiz(continentId);

  if (!quiz) {
    return { title: "Flag Quiz | Countries of the World" };
  }

  return {
    title: `${formatContinentQuizPrompt(mode?.prompt ?? "Which country is this flag?", quiz.continent.name)} | Countries of the World`,
    description: `Identify countries from flags in ${quiz.continent.name}.`,
  };
}

export default async function WhichCountryContinentQuizPage({
  params,
}: ContinentQuizPageProps) {
  const { continent: continentId } = await params;
  const quiz = getPlayableQuiz(continentId);

  if (!quiz || !mode) {
    notFound();
  }

  return (
    <FlagQuiz
      key={quiz.continent.id}
      title={quiz.continent.name}
      countries={quiz.countries}
      mode="flag-to-country"
      prompt={formatContinentQuizPrompt(mode.prompt, quiz.continent.name)}
      exitHref="/"
      exitLabel="Home"
    />
  );
}
