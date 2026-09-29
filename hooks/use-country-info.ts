"use client";

import { useEffect, useState } from "react";
import {
  fetchCountryByAlpha2,
  isValidRestCountry,
  type RestCountry,
} from "@/lib/rest-countries";

type UseCountryInfoResult = {
  country: RestCountry | null;
  isLoading: boolean;
  error: string | null;
};

const emptyResult: UseCountryInfoResult = {
  country: null,
  isLoading: false,
  error: null,
};

export function useCountryInfo(alpha2?: string): UseCountryInfoResult {
  const [result, setResult] = useState<UseCountryInfoResult>(emptyResult);

  useEffect(() => {
    if (!alpha2) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setResult((current) => ({
        country:
          current.country && isValidRestCountry(current.country)
            ? current.country
            : null,
        isLoading: true,
        error: null,
      }));

      try {
        const country = await fetchCountryByAlpha2(alpha2);
        if (cancelled) return;

        if (!country) {
          setResult({
            country: null,
            isLoading: false,
            error: "Country data not available.",
          });
          return;
        }

        setResult({ country, isLoading: false, error: null });
      } catch {
        if (!cancelled) {
          setResult({
            country: null,
            isLoading: false,
            error: "Failed to load country data.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [alpha2]);

  if (!alpha2) {
    return emptyResult;
  }

  return result;
}
