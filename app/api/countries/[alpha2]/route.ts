import { NextResponse } from "next/server";

const FIELDS =
  "name,capital,region,subregion,population,area,currencies,languages,timezones,flags";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ alpha2: string }> }
) {
  const { alpha2 } = await params;
  const code = alpha2.toLowerCase();

  if (!/^[a-z]{2}$/i.test(code)) {
    return NextResponse.json({ error: "Invalid country code" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${code}?fields=${FIELDS}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Country not found" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const country = Array.isArray(data) ? data[0] : data;

    return NextResponse.json(country);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch country data" },
      { status: 502 }
    );
  }
}
