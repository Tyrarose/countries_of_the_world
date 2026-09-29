import type { Metadata } from "next";
import { FlagQuiz } from "@/components/quiz/flag-quiz";
import { getWorldwideQuizCountries } from "@/lib/continent-quiz";

export const metadata: Metadata = {
  title: "Worldwide Flag Quiz | Countries of the World",
  description: "Challenge yourself with flags from every corner of the globe.",
};

export default function WorldwideQuizPage() {
  const countries = getWorldwideQuizCountries();

  return (
    <FlagQuiz
      title="Worldwide"
      countries={countries}
      exitHref="/"
      exitLabel="Home"
    />
  );
}
