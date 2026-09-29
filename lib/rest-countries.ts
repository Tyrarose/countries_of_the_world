export type RestCountry = {
  name: {
    common: string;
    official: string;
  };
  capital?: string[];
  region: string;
  subregion?: string;
  population: number;
  area: number;
  currencies?: Record<string, { name: string; symbol: string }>;
  languages?: Record<string, string>;
  timezones: string[];
  flags: {
    png: string;
    svg: string;
  };
};

const countryCache = new Map<string, RestCountry>();

export function isValidRestCountry(data: unknown): data is RestCountry {
  if (!data || typeof data !== "object") return false;

  const country = data as RestCountry;
  return (
    typeof country.name?.common === "string" &&
    typeof country.region === "string" &&
    typeof country.population === "number"
  );
}

export async function fetchCountryByAlpha2(
  alpha2: string
): Promise<RestCountry | null> {
  const code = alpha2.toLowerCase();

  if (countryCache.has(code)) {
    return countryCache.get(code) ?? null;
  }

  const response = await fetch(`/api/countries/${code}`);

  if (!response.ok) {
    return null;
  }

  const data: unknown = await response.json();

  if (!isValidRestCountry(data)) {
    return null;
  }

  countryCache.set(code, data);
  return data;
}

export function formatPopulation(population: number): string {
  return population.toLocaleString("en-US");
}

export function formatArea(area: number): string {
  return `${area.toLocaleString("en-US")} km²`;
}

export function formatRecordValues(
  record?: Record<string, string>
): string | undefined {
  if (!record) return undefined;
  return Object.values(record).join(", ");
}

export function formatCurrencies(
  currencies?: Record<string, { name: string; symbol: string }>
): string | undefined {
  if (!currencies) return undefined;
  return Object.entries(currencies)
    .map(([code, currency]) => `${currency.name} (${code}, ${currency.symbol})`)
    .join(", ");
}
