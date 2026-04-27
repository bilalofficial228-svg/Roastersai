import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, roastsTable, type RoastRow } from "@workspace/db";
import {
  GenerateRoastBody,
  ReactToRoastBody,
} from "@workspace/api-zod";
import { groqChat } from "../lib/groq";

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
    "FRIENDLY style: Think like a best friend teasing you lovingly. STRICT 3-line formula — Line 1: funny observation about their JOB (what's ironic or amusing about it), Line 2: light playful joke about their weakness OR relationship status, Line 3: warm funny ending that makes them smile — always end with 😄 or 😂. Tone: warm, light, fun — person smiles reading it, never feels hurt. Use LOCAL cultural references matching the selected language: English→American/British humor, Hindi→Bollywood/desi references, Urdu→Pakistani cultural jokes, Arabic→Arab cultural references, Spanish→Latin humor, French→French wit, German→German efficiency jokes, Chinese→Chinese culture, Portuguese→Brazilian humor. MAX 3 lines. MUST end with 😄 or 😂. So warm and shareable they send it to their friends!",
  savage:
    "SAVAGE style: Like a comedian on a roast show — brutal, no mercy, but still FUNNY not just mean. STRICT 3-line formula — Line 1: call out their job or life with an unexpected funny comparison, Line 2: directly target their weakness, city, or status — make it sting!, Line 3: one killer punchline ending with 💀 or 🔥. 'Too real!' feeling — funny AND stings. NEVER vulgar, sexual, or offensive. Use LOCAL city references: Karachi→load shedding/traffic, Lahore→smog/food, Delhi→pollution/jugaad, Mumbai→local train/rent, New York→expensive/hustle, London→weather/queue, Dubai→money/luxury. Job references: Engineer→bugs/deadlines/chai, Doctor→God complex/no sleep, Student→marks/Netflix/future, Content Creator→views/followers, Unemployed→Netflix/excuses, Designer→Behance/fonts, Teacher→salary/students. Status: Single→forever alone/WiFi, Married→no freedom, Complicated→commitment issues. Write ONLY in the selected language using local culture. MAX 3 lines. So savage they MUST share it!",
  dark:
    "DARK style: Existential angle on their life choices — philosophical dry humor, deadpan nihilist energy. Makes them think AND laugh. Dark but not depressing — edgy about life around them, not a personal attack. STRICT emoji rule: use MINIMUM 2 emojis from this set: 💀 (too real moment), 😂 (dark funny), 🌑 (dark vibe), ⚰️ (completely destroyed), 😭 (painful truth). Place emojis INSIDE sentences naturally, not all at the end. End with a killer dark punchline. MAX 3 lines.",
  desi:
    "DESI style: Use family/society pressure angle, 'what will people think' (log kya kahenge) shame humor, nosy neighbor aunty/uncle references, marriage and career pressure jokes — relatable South Asian experience. CRITICAL: The LANGUAGE RULE is absolute — use ONLY the selected language. If English is selected, translate ALL desi concepts: 'mohalla'→'neighborhood', 'aunty'→'nosy neighbor lady', 'rishta'→'marriage proposal', 'log kya kahenge'→'what will people think', 'shaadi'→'marriage'. ZERO Hindi/Urdu words when English is selected. MAX 3 lines.",
};

const LANGUAGE_DIRECTIONS: Record<Language, string> = {
  english:
    "Generate roast in ENGLISH language ONLY. 100% English. Do NOT mix in ANY Hindi, Urdu, Hinglish, or other language words — this applies even when the style is Desi. Translate all desi concepts into English. Pure English vocabulary and grammar ONLY.",
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
    "Generate roast in URDU language ONLY, written in proper Urdu Nastaliq script (اردو). Every word must be in Urdu script — ZERO Roman/Latin letters. Use simple everyday Urdu words that anyone understands. Be funny through clever observations and desi cultural references — family pressure, job struggles, marriage, neighbors, city life. Use wordplay and punchlines natural to Urdu humor. MAX 3 lines, one killer punchline at end. Example style: 'ہونا، امریکا میں ڈاکٹر بن گئی / لیکن اپنی زندگی کا نسخہ ابھی تک غلط ہے 💀 / مریض تو ٹھیک ہو جاتے ہیں، تیری قسمت کا علاج نہیں 😂'",
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
- Write MAXIMUM 3 lines — never more, never 4, ALWAYS 3 or fewer
- Each line maximum 10-12 words ONLY
- Total roast: 40 words MAXIMUM — if longer, it is WRONG
- Use MINIMUM 2 emojis — never give a roast without emojis
- Place emojis naturally INSIDE sentences, not all at the end
- Never write long paragraphs
- Never write essays
- If you exceed 3 lines = WRONG, rewrite shorter

EMOJI EXAMPLES:
GOOD: 'Bilal 💀 tu engineer hai'
GOOD: 'teri life ka bug tu hai 🔥'
BAD: 'long roast text... 🔥💀😂👀😭' (all at end)
BAD: roast with zero emojis (NEVER allowed)

CONTENT RULES — ABSOLUTE:
- ZERO vulgar, offensive, or sexual words — ever
- ZERO slurs or attacks on race, religion, gender, sexuality, disability, nationality
- Keep ALL roasts clean and family-friendly
- Funny through wit and observation, never through vulgarity
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

  const text = await groqChat(SYSTEM_PROMPT, userPrompt);
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
  } catch (err: any) {
    req.log.error({ err }, "Failed to generate roast");
    const msg = err?.message ?? "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return res.status(429).json({ error: "API quota exceeded. Please try again in a few minutes." });
    }
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
