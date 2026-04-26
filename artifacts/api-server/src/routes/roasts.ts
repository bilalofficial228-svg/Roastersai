import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, roastsTable, type RoastRow } from "@workspace/db";
import {
  GenerateRoastBody,
  ReactToRoastBody,
} from "@workspace/api-zod";
import { gemini } from "../lib/gemini";

const router: IRouter = Router();

type RoastStyle = "friendly" | "savage" | "dark" | "desi";
type Job =
  | "student" | "engineer" | "doctor" | "designer"
  | "unemployed" | "influencer" | "teacher" | "lawyer"
  | "business_owner" | "content_creator" | "chef" | "nurse"
  | "accountant" | "marketing" | "sales" | "other";
type Status = "single" | "in_relationship" | "married" | "complicated" | "recently_broke_up" | "forever_alone";
type Language = "english" | "hinglish" | "hindi" | "spanish" | "arabic" | "french" | "portuguese" | "german" | "chinese" | "urdu";
type ReactionType = "hilarious" | "savage" | "dead" | "too_real";

const STYLE_PROMPTS: Record<RoastStyle, string> = {
  friendly:
    "Playful and lighthearted teasing — warm, witty, the kind of roast a close friend would deliver with a grin. Tease, don't wound.",
  savage:
    "Brutal but clever — modern internet/Gen-Z roast energy. Sharp, cutting, devastating but still funny. No slurs, no protected-class jabs.",
  dark:
    "Dark humor — dry, deadpan, existential. Think nihilist comic on a 2 a.m. open mic. Edgy but not nihilistic about the person, just life-around-them.",
  desi:
    "Desi (South Asian) roast culture — uncle/auntie energy, mix in light Hinglish/Urdu phrases like 'beta', 'haww', 'sharam karo', 'kya kar raha hai'. Street-smart, theatrical, hilarious.",
};

const LANGUAGE_DIRECTIONS: Record<Language, string> = {
  english:
    "Generate roast in ENGLISH language ONLY. 100% English. Do NOT mix in any Hindi, Hinglish, Spanish, French or any other language words or phrases. Pure English vocabulary and grammar.",
  hinglish:
    "Generate roast in HINGLISH ONLY — a natural Hindi-English code-switch written in ROMAN SCRIPT (no Devanagari). Mix Hindi words like 'bhai', 'yaar', 'matlab', 'arre', 'kya', 'haww', 'sharam karo', 'beta' naturally with English. Do NOT use pure English-only sentences and do NOT use Devanagari script.",
  hindi:
    "Generate roast in HINDI language ONLY, written in DEVANAGARI script (हिन्दी). 100% Hindi. Do NOT include any English words, Roman script, Hinglish, or any other language. Pure Hindi vocabulary and grammar.",
  spanish:
    "Generate roast in SPANISH language ONLY. 100% Spanish. Do NOT mix in any English, Hindi or other language words or phrases. Pure Spanish vocabulary and grammar.",
  arabic:
    "Generate roast in ARABIC language ONLY, written in Arabic script (RTL). 100% Arabic. Do NOT include any English words, Roman script, or any other language. Use Modern Standard Arabic (فصحى). Pure Arabic vocabulary and grammar.",
  french:
    "Generate roast in FRENCH language ONLY. 100% French. Do NOT mix in any English, Hindi or other language words or phrases. Pure French vocabulary and grammar.",
  portuguese:
    "Generate roast in PORTUGUESE (Brazilian Portuguese) language ONLY. 100% Portuguese. Do NOT mix in any English or other language words. Pure Portuguese vocabulary and grammar.",
  german:
    "Generate roast in GERMAN language ONLY. 100% Deutsch. Do NOT mix in any English or other language words. Pure German vocabulary and grammar.",
  chinese:
    "Generate roast in SIMPLIFIED CHINESE (普通话) language ONLY, written in Chinese characters. 100% Chinese. Do NOT include any English words, Pinyin, or any other language. Pure Simplified Chinese.",
  urdu:
    "Generate roast in URDU language ONLY, written in Urdu Nastaliq script (اردو). 100% Urdu. Do NOT include any English words, Roman script, or any other language. Pure Urdu vocabulary and grammar.",
};


const JOB_LABEL: Record<Job, string> = {
  student: "student",
  engineer: "software engineer",
  doctor: "doctor",
  designer: "designer",
  unemployed: "unemployed person",
  influencer: "influencer",
  teacher: "teacher",
  lawyer: "lawyer",
  business_owner: "business owner",
  content_creator: "content creator",
  chef: "chef",
  nurse: "nurse",
  accountant: "accountant",
  marketing: "marketing professional",
  sales: "sales person",
  other: "person",
};

const STATUS_LABEL: Record<Status, string> = {
  single: "single",
  in_relationship: "in a relationship",
  married: "married",
  complicated: "in a complicated relationship",
  recently_broke_up: "recently broke up",
  forever_alone: "forever alone",
};

const SYSTEM_PROMPT = `You are a savage AI comedian.

STRICT RULES - FOLLOW EXACTLY:
- Write ONLY 3 or 4 lines maximum
- Each line maximum 15 words
- Total roast: 40-50 words only
- Use ONLY 1-2 emojis total
- Place emojis naturally INSIDE the sentences
- Never put all emojis at end
- Never write long paragraphs
- Never write essays

EMOJI EXAMPLES:
GOOD: 'Bilal 💀 tu engineer hai'
GOOD: 'teri life ka bug tu hai 🔥'
BAD: 'long roast text... 🔥💀😂👀😭'

Never use slurs, sexual content, or attacks on protected classes (race, religion, gender, sexuality, disability, nationality).
NO disclaimers! NO apologies! NO preface! Output ONLY the roast text.`;

interface RoastInput {
  name: string;
  job: Job;
  city: string;
  weakness?: string | null;
  status: Status;
  language: Language;
  intensity: number;
  style: RoastStyle;
}

async function generateRoastText(input: RoastInput): Promise<string> {
  const userPrompt = [
    `LANGUAGE RULE: ${LANGUAGE_DIRECTIONS[input.language]}`,
    ``,
    `STYLE RULE: ${STYLE_PROMPTS[input.style]}`,
    ``,
    `Person:`,
    `Name: ${input.name}`,
    `Job: ${JOB_LABEL[input.job]}`,
    `City: ${input.city}`,
    `Weakness: ${input.weakness?.trim() || "not given"}`,
    `Status: ${STATUS_LABEL[input.status]}`,
    ``,
    `START with their NAME! 3-4 lines only! Screenshot worthy! No disclaimers! No apologies!`,
  ].join("\n");

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] },
    ],
    config: { maxOutputTokens: 8192 },
  });

  const text = response.text?.trim() ?? "";
  if (!text) {
    throw new Error("Empty AI response");
  }
  return text.replace(/^["'`]+|["'`]+$/g, "").trim();
}

function serializeRoast(row: RoastRow) {
  return {
    id: row.id,
    text: row.text,
    style: row.style,
    name: row.name || row.target,
    job: row.job,
    city: row.city,
    weakness: row.weakness,
    status: row.status,
    language: row.language,
    intensity: row.intensity,
    reactions: {
      hilarious: row.hilariousCount,
      savage: row.savageCount,
      dead: row.deadCount,
      too_real: row.tooRealCount,
    },
    createdAt: row.createdAt.toISOString(),
  };
}

router.post("/roasts/generate", async (req, res) => {
  const parsed = GenerateRoastBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.issues });
  }

  const data = parsed.data;
  const input: RoastInput = {
    name: data.name,
    job: data.job as Job,
    city: data.city,
    weakness: data.weakness ?? null,
    status: data.status as Status,
    language: data.language as Language,
    intensity: data.intensity,
    style: data.style as RoastStyle,
  };

  try {
    const text = await generateRoastText(input);

    const [row] = await db
      .insert(roastsTable)
      .values({
        target: input.name,
        style: input.style,
        text,
        name: input.name,
        job: input.job,
        city: input.city,
        weakness: input.weakness ?? null,
        status: input.status,
        language: input.language,
        intensity: input.intensity,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to persist roast");
    }

    return res.json(serializeRoast(row));
  } catch (err) {
    req.log.error({ err }, "Failed to generate roast");
    return res
      .status(500)
      .json({ error: "Roast machine broke. Try again in a sec." });
  }
});

router.get("/roasts/trending", async (_req, res) => {
  const rows = await db
    .select()
    .from(roastsTable)
    .orderBy(desc(roastsTable.createdAt))
    .limit(12);

  res.json(rows.map(serializeRoast));
});

router.get("/roasts/leaderboard", async (_req, res) => {
  // Top roasts today by burn score (sum of all reactions, weighted by savage/dead).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(roastsTable)
    .where(sql`${roastsTable.createdAt} >= ${since.toISOString()}`)
    .orderBy(desc(roastsTable.createdAt))
    .limit(50);

  const scored = rows
    .map((row) => {
      const burnScore =
        row.hilariousCount * 1 +
        row.savageCount * 2 +
        row.deadCount * 2 +
        row.tooRealCount * 3 +
        row.intensity * 5;
      return { row, burnScore };
    })
    .sort((a, b) => b.burnScore - a.burnScore)
    .slice(0, 10);

  res.json(
    scored.map(({ row, burnScore }, idx) => ({
      rank: idx + 1,
      name: row.name || row.target || "Anonymous",
      job: row.job,
      text: row.text,
      burnScore,
    })),
  );
});

router.get("/roasts/stats", async (_req, res) => {
  const rows = await db.select({ id: roastsTable.id }).from(roastsTable);
  const realTotal = rows.length;

  const epochDays = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const minutesToday = Math.floor(
    (Date.now() % (1000 * 60 * 60 * 24)) / (1000 * 60),
  );
  const secondsToday = Math.floor(
    (Date.now() % (1000 * 60 * 60 * 24)) / 1000,
  );

  const baseTotal = 2_847_000;
  const dailyDrift = epochDays * 137;
  const minuteDrift = minutesToday * 3;
  const totalRoasts = baseTotal + dailyDrift + minuteDrift + realTotal;

  const usersToday = 1500 + Math.floor(minutesToday * 0.35) + realTotal;
  const roastsPerMinute = 8 + (minutesToday % 8);
  const worldwideToday =
    1_500 + Math.floor(secondsToday * 0.012) + realTotal * 3;

  res.json({ totalRoasts, usersToday, roastsPerMinute, worldwideToday });
});

router.get("/roasts/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(404).json({ error: "Not found" });
  }
  const [row] = await db
    .select()
    .from(roastsTable)
    .where(eq(roastsTable.id, id))
    .limit(1);
  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json(serializeRoast(row));
});

router.post("/roasts/:id/reactions", async (req, res) => {
  const { id } = req.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(404).json({ error: "Not found" });
  }
  const parsed = ReactToRoastBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.issues });
  }

  const type = parsed.data.type as ReactionType;
  const updates =
    type === "hilarious"
      ? { hilariousCount: sql`${roastsTable.hilariousCount} + 1` }
      : type === "savage"
        ? { savageCount: sql`${roastsTable.savageCount} + 1` }
        : type === "dead"
          ? { deadCount: sql`${roastsTable.deadCount} + 1` }
          : { tooRealCount: sql`${roastsTable.tooRealCount} + 1` };

  const [row] = await db
    .update(roastsTable)
    .set(updates)
    .where(eq(roastsTable.id, id))
    .returning();

  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json({
    hilarious: row.hilariousCount,
    savage: row.savageCount,
    dead: row.deadCount,
    too_real: row.tooRealCount,
  });
});

export default router;
