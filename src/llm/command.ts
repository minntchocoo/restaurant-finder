// src/llm/command.ts
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RestaurantCommand } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in .env");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });


const SYSTEM_PROMPT = `
You are a strict JSON command generator for a restaurant finder API.

Given a user's natural language request, you MUST respond with ONLY valid JSON,
no explanations, no code fences.

Use this exact shape:

{
  "action": "restaurant_search",
  "parameters": {
    "query"?: string,
    "near"?: string,
    "ll"?: string,
    "min_price"?: 1|2|3|4,
    "max_price"?: 1|2|3|4,
    "open_now"?: boolean,
    "min_rating"?: number
  }
}

Rules:
- Never include comments.
- Never wrap the JSON in backticks.
- If you are unsure, make your best guess.
`;

export async function buildRestaurantCommand(
  message: string
): Promise<RestaurantCommand> {
  const prompt = `${SYSTEM_PROMPT}\n\nUser message:\n${message}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Safety: just in case Gemini still sends ```json ... ```
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let command: RestaurantCommand;
  try {
    command = JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini raw output:", text);
    throw new Error("Gemini did not return valid JSON");
  }

  if (command.action !== "restaurant_search") {
    throw new Error("Unsupported action from LLM");
  }

  return command;
}
