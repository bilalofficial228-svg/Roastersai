import { GoogleGenAI } from "@google/genai";

const apiKey = process.env["ROSTER_AI"];

if (!apiKey) {
  throw new Error("ROSTER_AI environment variable must be set");
}

export const gemini = new GoogleGenAI({ apiKey });
