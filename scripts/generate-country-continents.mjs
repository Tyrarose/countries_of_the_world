import fs from "node:fs";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  result.push(current);
  return result;
}

const response = await fetch(
  "https://raw.githubusercontent.com/datasets/country-codes/master/data/country-codes.csv"
);
const text = await response.text();
const lines = text.split("\n");
const headers = parseCSVLine(lines[0]);
const alpha2Idx = headers.indexOf("ISO3166-1-Alpha-2");
const continentIdx = headers.indexOf("Continent");
const mapping = {};

for (let index = 1; index < lines.length; index += 1) {
  const line = lines[index];
  if (!line.trim()) continue;

  const columns = parseCSVLine(line);
  const alpha2 = columns[alpha2Idx]?.toLowerCase();
  const continent = columns[continentIdx];

  if (!alpha2 || alpha2.length !== 2) continue;

  let continentId;
  if (continent === "AF") continentId = "africa";
  else if (continent === "AN") continentId = "antarctica";
  else if (continent === "AS") continentId = "asia";
  else if (continent === "EU") continentId = "europe";
  else if (continent === "OC") continentId = "oceania";
  else if (continent === "SA") continentId = "south-america";
  else if (continent === "NA") continentId = "north-america";

  if (continentId) {
    mapping[alpha2] = continentId;
  }
}

fs.writeFileSync(
  "lib/country-continents-data.json",
  `${JSON.stringify(mapping, null, 2)}\n`
);

console.log(`Wrote ${Object.keys(mapping).length} mappings`);
