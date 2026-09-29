"use client";

import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCountryInfo } from "@/hooks/use-country-info";
import {
  formatArea,
  formatCurrencies,
  formatPopulation,
  formatRecordValues,
} from "@/lib/rest-countries";
import { getFlagUrl } from "@/lib/country-codes";
import { cn } from "@/lib/utils";

type CountryInfoCardProps = {
  alpha2?: string;
  countryName: string;
  className?: string;
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function CountryInfoCard({
  alpha2,
  countryName,
  className,
}: CountryInfoCardProps) {
  const { country, isLoading, error } = useCountryInfo(alpha2);

  const displayName = country?.name?.common ?? countryName;
  const flagUrl = alpha2
    ? country?.flags?.png ?? getFlagUrl(alpha2)
    : undefined;

  return (
    <Card
      className={cn(
        "w-80 max-w-[calc(100vw-2rem)] shadow-lg",
        className
      )}
      role="region"
      aria-label={`Country information for ${displayName}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {flagUrl && (
            <div className="h-10 w-14 shrink-0 overflow-hidden rounded border bg-muted">
              {isLoading && !country ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- external flag URL from REST Countries API
                <img
                  src={flagUrl}
                  alt={`Flag of ${displayName}`}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}
          <div>
            <CardTitle>{displayName}</CardTitle>
            {country?.name?.official && (
              <CardDescription className="line-clamp-2">
                {country.name.official}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!alpha2 && (
          <p className="text-sm text-muted-foreground">
            Detailed data is not available for this territory.
          </p>
        )}

        {alpha2 && isLoading && !country && (
          <p className="text-sm text-muted-foreground">Loading country data…</p>
        )}

        {alpha2 && error && !isLoading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {country?.name?.common && (
          <dl className="space-y-2">
            <InfoRow label="Capital" value={country.capital?.join(", ")} />
            <InfoRow
              label="Region"
              value={
                country.subregion
                  ? `${country.region} · ${country.subregion}`
                  : country.region
              }
            />
            <InfoRow
              label="Population"
              value={formatPopulation(country.population)}
            />
            {typeof country.area === "number" && (
              <InfoRow label="Area" value={formatArea(country.area)} />
            )}
            <InfoRow
              label="Languages"
              value={formatRecordValues(country.languages)}
            />
            <InfoRow
              label="Currencies"
              value={formatCurrencies(country.currencies)}
            />
            <InfoRow
              label="Timezones"
              value={country.timezones?.slice(0, 3).join(", ")}
            />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
