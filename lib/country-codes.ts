import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export function getAlpha2FromGeoId(geoId: string | number): string | undefined {
  const numericId = String(geoId).padStart(3, "0");
  const alpha2 = countries.numericToAlpha2(numericId);
  return alpha2?.toLowerCase();
}

export function getCountryNameFromGeoId(geoId: string | number): string | undefined {
  const alpha2 = countries.numericToAlpha2(String(geoId).padStart(3, "0"));
  if (!alpha2) return undefined;
  return countries.getName(alpha2, "en");
}

export function getCountryNameFromAlpha2(alpha2: string): string | undefined {
  return countries.getName(alpha2, "en");
}

export function getFlagUrl(alpha2: string, width = 320): string {
  return `https://flagcdn.com/w${width}/${alpha2.toLowerCase()}.png`;
}
