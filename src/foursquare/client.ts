// src/foursquare/client.ts
import dotenv from "dotenv";
dotenv.config();

import type { RestaurantSearchParameters } from "../types";

// ✅ NEW base URL (no /v3, new host)
const FSQ_BASE_URL = "https://places-api.foursquare.com/places/search";

const fsqApiKey: string = process.env.FSQ_API_KEY ?? "";

if (!fsqApiKey) {
  throw new Error("FSQ_API_KEY is not set in .env");
}

// 🔍 Debug: show that we actually loaded the key
console.log(
  "[FSQ] FSQ_API_KEY loaded?",
  fsqApiKey ? fsqApiKey.slice(0, 5) + "..." : "undefined",
  "length:",
  fsqApiKey?.length
);

export interface FoursquarePlace {
  fsq_place_id?: string; // new field name in migration guide
  fsq_id?: string;       // keep old one just in case
  name: string;
  location?: {
    address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
  categories?: { name: string }[];

}

export async function searchRestaurantsFromFoursquare(
  params: RestaurantSearchParameters
): Promise<FoursquarePlace[]> {
  const url = new URL(FSQ_BASE_URL);

  if (params.query) url.searchParams.set("query", params.query);
  if (params.near) url.searchParams.set("near", params.near);
  if (params.ll) url.searchParams.set("ll", params.ll);
  if (params.min_price) url.searchParams.set("min_price", String(params.min_price));
  if (params.max_price) url.searchParams.set("max_price", String(params.max_price));
  if (params.open_now) url.searchParams.set("open_now", "true");

  url.searchParams.set("limit", "20");

  url.searchParams.set(
    "fields",
    ["fsq_place_id", "name", "location", "categories"].join(",")
  );

  // 🔍 Debug: log the outgoing request (safe version)
  console.log("[FSQ] Request URL:", url.toString());
  console.log(
    "[FSQ] Request headers:",
    {
      Accept: "application/json",
      Authorization: `Bearer ${fsqApiKey.slice(0, 5)}...`, // only show prefix
      "X-Places-Api-Version": "2025-06-17",
    }
  );

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      // ✅ NEW auth format: Bearer + service key
      Authorization: `Bearer ${fsqApiKey}`,
      // ✅ NEW version header
      "X-Places-Api-Version": "2025-06-17",
    },
  });

  // 🔍 Debug: log status code
  console.log("[FSQ] Response status:", res.status);

  if (!res.ok) {
    const text = await res.text();
    console.error("[FSQ] Foursquare API error:", res.status, text);
    // If it's a rate-limit / billing issue, surface a clearer message
    if (res.status === 429) {
        throw new Error(`Foursquare rate limit or billing issue (429): ${text}`);
    }

    throw new Error(`Foursquare API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log("[FSQ] Response parsed OK, results length:", data.results?.length ?? 0);

  return (data.results ?? []) as FoursquarePlace[];
}
