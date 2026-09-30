import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewQuiz } from "@/components/quiz/review-quiz";
import { getPlayableContinents, getPlayableQuiz } from "@/lib/continent-quiz";
import { getContinentQuizMode } from "@/lib/continent-quiz-modes";

const mode = getContinentQuizMode("review");

type ContinentReviewPageProps = {
  params: Promise<{ continent: string }>;
};

export function generateStaticParams() {
  return getPlayableContinents().map((continent) => ({
    continent: continent.id,
  }));
}

export async function generateMetadata({
  params,
}: ContinentReviewPageProps): Promise<Metadata> {
  const { continent: continentId } = await params;
  const quiz = getPlayableQuiz(continentId);

  if (!quiz) {
    return { title: "Intuitive Flag Review | Countries of the World" };
  }

  return {
    title: `Intuitive flag review in ${quiz.continent.name} | Countries of the World`,
    description: `Review flags and countries in ${quiz.continent.name} with two choices, in groups of 7.`,
  };
}

export default async function ReviewContinentQuizPage({
  params,
}: ContinentReviewPageProps) {
  const { continent: continentId } = await params;
  const quiz = getPlayableQuiz(continentId);

  if (!quiz || !mode) {
    notFound();
  }

  return (
    <ReviewQuiz
      key={quiz.continent.id}
      title={quiz.continent.name}
      continentName={quiz.continent.name}
      countries={quiz.countries}
      exitHref="/"
      exitLabel="Home"
    />
  );
}
