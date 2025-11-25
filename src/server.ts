// src/server.ts
import express from "express";
import dotenv from "dotenv";
import { buildRestaurantCommand } from "./llm/command";
import { searchRestaurantsFromFoursquare } from "./foursquare/client";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// expected access code (read from .env)
const ACCESS_CODE = process.env.API_ACCESS_CODE || "pioneerdevai";

app.get("/", (_req, res) => {
  res.send("Restaurant Finder API is running ");
});

app.get("/api/execute", async (req, res) => {
  try {
    const code = req.query.code as string | undefined;
    const message = req.query.message as string | undefined;

    // 1. Validate code
    if (!code || code !== ACCESS_CODE) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 2. Validate message
    if (!message) {
      return res
        .status(400)
        .json({ error: "Missing 'message' query parameter" });
    }

    // 3. Use Gemini to build the JSON command
    const command = await buildRestaurantCommand(message);

    // 4. Use the command parameters to call Foursquare
    const fsqResults = await searchRestaurantsFromFoursquare(
      command.parameters
    );

    // 5. Return a clean JSON response
    return res.json({
      query: message,
      command,
      results: fsqResults.map((place) => ({
        id: place.fsq_place_id ?? place.fsq_id, // support both
        name: place.name,
        address: place.location?.address,
        city: place.location?.locality,
        region: place.location?.region,
        country: place.location?.country,
        categories: place.categories?.map((c) => c.name),
      })),
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      error: "Internal server error",
      detail: err.message ?? String(err),
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
