import offeringsData from "./cgi-offerings.json";

export interface CgiOffering {
  id: string;
  name: string;
  description: string;
  targetSectors: string[];
  keywords: string[];
  valueProposition: string;
}

const offerings: CgiOffering[] = offeringsData;

export function getAllOfferings(): CgiOffering[] {
  return offerings;
}

export function getOfferingById(id: string): CgiOffering | undefined {
  return offerings.find((o) => o.id === id);
}

export function searchOfferings(query: string): CgiOffering[] {
  const terms = query.toLowerCase().split(/\s+/);
  return offerings.filter((offering) => {
    const searchable = [
      offering.name,
      offering.description,
      ...offering.keywords,
      ...offering.targetSectors,
    ]
      .join(" ")
      .toLowerCase();
    return terms.some((term) => searchable.includes(term));
  });
}

export function getOfferingsForSector(sector: string): CgiOffering[] {
  const sectorLower = sector.toLowerCase();
  return offerings.filter((o) =>
    o.targetSectors.some((s) => sectorLower.includes(s) || s.includes(sectorLower))
  );
}
