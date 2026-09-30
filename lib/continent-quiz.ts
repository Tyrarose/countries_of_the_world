import countryContinentsData from "@/lib/country-continents-data.json";
import { getCountryNameFromAlpha2 } from "@/lib/country-codes";
import { continents, type Continent } from "@/lib/continents";
import { QUIZ_CHOICE_COUNT, type QuizCountry } from "@/lib/quiz-session";

export type PlayableContinent = Continent & {
  countryCount: number;
};

const countriesByContinent = groupCountries();

export function getQuizCountries(continentId: string): QuizCountry[] {
  return [...(countriesByContinent.get(continentId) ?? [])];
}

export const worldwideQuizSizes = [
  { id: "15", label: "15", limit: 15 },
  { id: "25", label: "25", limit: 25 },
  { id: "50", label: "50", limit: 50 },
  { id: "100", label: "100", limit: 100 },
  { id: "200", label: "200", limit: 200 },
  { id: "all", label: "All", limit: null },
] as const;

export type WorldwideQuizSize = (typeof worldwideQuizSizes)[number];

export function getWorldwideQuizSize(
  sizeId: string
): WorldwideQuizSize | undefined {
  return worldwideQuizSizes.find((size) => size.id === sizeId);
}

export function getWorldwideQuizCountries(): QuizCountry[] {
  return [...countriesByContinent.values()]
    .flat()
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function getPlayableContinents(): PlayableContinent[] {
  return continents.flatMap((continent) => {
    const countryCount = getQuizCountries(continent.id).length;
    if (countryCount < QUIZ_CHOICE_COUNT) return [];
    return [{ ...continent, countryCount }];
  });
}

export function getPlayableQuiz(continentId: string): {
  continent: Continent;
  countries: QuizCountry[];
} | null {
  const continent = continents.find((item) => item.id === continentId);
  if (!continent) return null;

  const countries = getQuizCountries(continent.id);
  if (countries.length < QUIZ_CHOICE_COUNT) return null;

  return { continent, countries };
}

function groupCountries(): Map<string, QuizCountry[]> {
  const grouped = new Map<string, QuizCountry[]>();

  for (const [alpha2, continentId] of Object.entries(
    countryContinentsData as Record<string, string>
  )) {
    const name = getCountryNameFromAlpha2(alpha2);
    if (!name) continue;

    const list = grouped.get(continentId);
    const country = { alpha2, name };
    if (list) {
      list.push(country);
    } else {
      grouped.set(continentId, [country]);
    }
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "en"));
  }

  return grouped;
}
