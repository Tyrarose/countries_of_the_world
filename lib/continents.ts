export type Continent = {
  id: string;
  name: string;
  description: string;
};

export const continents: Continent[] = [
  {
    id: "africa",
    name: "Africa",
    description:
      "The world's second-largest continent, home to 54 countries and over 1.4 billion people.",
  },
  {
    id: "antarctica",
    name: "Antarctica",
    description:
      "The southernmost continent — a vast, icy wilderness with no permanent residents.",
  },
  {
    id: "asia",
    name: "Asia",
    description:
      "The largest continent by area and population, stretching from the Middle East to the Pacific.",
  },
  {
    id: "europe",
    name: "Europe",
    description:
      "A continent rich in history and culture, bordered by the Atlantic, Arctic, and Mediterranean.",
  },
  {
    id: "north-america",
    name: "North America",
    description:
      "Stretching from the Arctic to Central America, including Canada, the United States, and Mexico.",
  },
  {
    id: "oceania",
    name: "Oceania",
    description:
      "A region of islands and nations across the Pacific, including Australia and New Zealand.",
  },
  {
    id: "south-america",
    name: "South America",
    description:
      "Home to the Amazon rainforest, the Andes mountains, and 12 diverse nations.",
  },
];
