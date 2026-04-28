import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, roastsTable, type RoastRow } from "@workspace/db";
import {
  GenerateRoastBody,
  ReactToRoastBody,
} from "@workspace/api-zod";
import { groqChat } from "../lib/groq";

const router: IRouter = Router();

function generateShortId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

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
    "FRIENDLY style — TONE: 20% roast + 80% warm. Like a best friend teasing you lovingly. Line 1: one small funny observation about their JOB. Line 2: one light joke about their weakness OR status. Line 3: warm sweet ending — person feels GOOD after reading. NEVER harsh, NEVER mean. MUST end with 😄 or 😂. Use name, city, job. Always use LOCAL cultural references matching the selected language: English→American/British humor, Hindi→Bollywood/desi references, Urdu→Pakistani cultural jokes, Arabic→Arab references, Spanish→Latin humor, French→French wit, German→German efficiency jokes, Chinese→Chinese culture, Portuguese→Brazilian humor. MAX 3 lines. Screenshot worthy!",
  savage:
    "SAVAGE style — TONE: 90% roast + 10% funny. Comedy roast show energy — no mercy but still FUNNY. Truth said boldly, stings but makes them laugh. 'Too real!' feeling. Line 1: call out their job/life with unexpected comparison. Line 2: directly target weakness, city, or status — make it sting! Line 3: killer punchline ending with 💀 or 🔥. NEVER vulgar, sexual, or offensive. City refs: Karachi→load shedding/traffic, Lahore→smog/food, Delhi→pollution/jugaad, Mumbai→local train/rent, New York→expensive/hustle, London→weather/queue, Dubai→money/luxury. Job refs: Engineer→bugs/deadlines/chai, Doctor→God complex/no sleep, Student→marks/Netflix/future, Content Creator→views/followers, Unemployed→Netflix/excuses, Designer→Behance/fonts, Teacher→salary/students. Status: Single→forever alone/WiFi, Married→no freedom. Write ONLY in selected language. MAX 3 lines. So savage they MUST share!",
  dark:
    "DARK style — TONE: 70% existential + 30% funny. Question their life choices with philosophical dry humor. Deep psychological burn — dark but NOT depressing. Makes them think AND laugh. Deadpan nihilist energy, edgy about life around them not attacking them personally. Minimum 2 emojis from: 💀 (too real), 😂 (dark funny), 🌑 (dark vibe), ⚰️ (destroyed), 😭 (painful truth). Place emojis INSIDE sentences, not all at end. MUST end with 💀 or 🌑. MAX 3 lines.",
  desi:
    "DESI style — TONE: 80% cultural + 20% family pressure. Log kya kahenge angle — what will people think shame humor. Aunty/uncle references, shaadi/career pressure, relatable South Asian humor. CRITICAL language rule: use ONLY the selected language. If English selected, translate ALL desi concepts: 'mohalla'→'neighborhood', 'aunty'→'nosy neighbor lady', 'rishta'→'marriage proposal', 'log kya kahenge'→'what will people think', 'shaadi'→'marriage'. ZERO Hindi/Urdu words when English selected. MUST end with 😭 or 🔥. MAX 3 lines.",
};

const LANGUAGE_DIRECTIONS: Record<Language, string> = {
  english:
    "Generate roast in ENGLISH language ONLY. 100% English. Do NOT mix in ANY Hindi, Urdu, Hinglish, or other language words — this applies even when the style is Desi. Translate all desi concepts into English. Pure English vocabulary and grammar ONLY.",
  hinglish:
    "Generate roast in HINGLISH ONLY — a natural Hindi-English code-switch written in ROMAN SCRIPT (no Devanagari). Mix Hindi words like 'bhai', 'yaar', 'matlab', 'arre', 'kya', 'haww', 'sharam karo', 'beta' naturally with English. Do NOT use pure English-only sentences and do NOT use Devanagari script.",
  hindi:
    "Generate roast in HINDI language ONLY, written in DEVANAGARI script (हिन्दी). 100% Hindi — ZERO English words, ZERO Roman script. Tone: conversational Hindi like friends talking in India — simple everyday words only, never confusing. Always use the person's NAME, CITY, and JOB with irony. Use Bollywood references and Indian cultural humor. 2-3 emojis placed inside sentences. GOOD example: 'Anjum bhai, accountant hai / lekin apni zindagi ka budget / hamesha minus mein hai 💀 / Single isliye ki Excel mein / biwi ka column hi nahi 😂'. BAD (never do this): confusing sentences like 'tum khata hi khata ho'. MAX 3 lines, clear funny punchline at end. Screenshot worthy!",
  spanish:
    "Generate roast in SPANISH language ONLY. 100% Spanish. Do NOT mix in any English, Hindi or other language words or phrases. Pure Spanish vocabulary and grammar.",
  arabic:
    "Generate roast in ARABIC language ONLY, written in Arabic script (RTL). 100% Arabic — ZERO English words or Roman letters. Use simple colloquial Arabic that everyone understands. STRICT STRUCTURE — 3 lines MAX: Line 1 = NAME + CITY reference + JOB mention. Line 2 = weakness or status joke with CITY flavor. Line 3 = killer punchline ending with emoji. MANDATORY: NAME must appear in Line 1. CITY must appear in Line 1 or 2. JOB must appear always. STATUS punchline in Line 3. 2-3 emojis placed INSIDE sentences. Simple clear words — no confusing metaphors. FRIENDLY example: 'أوسامة، مؤثر في أمريكا / لكن محتوى فيديوهاتك خفيف مثل ريح الصحراء 😄 / لا بأس، يوماً ما ستجد شخصاً يشاهدك 😂'. SAVAGE example: 'أوسامة، تدّعي أنك مؤثر / لكن في أمريكا ما أحد يعرفك حتى 💀 / محفظتك فارغة مثل قناتك على يوتيوب 🔥'. DARK example: 'أوسامة، تعيش في أمريكا / لكن حياتك أظلم من ليل الصحراء 🌑 / المشاهير يتركون أثراً، أنت تترك فقط ديوناً 💀'. DESI example: 'أوسامة، كل الحارة تعرف / إنك لسا عازب في أمريكا 😭 / أهلك يسألون متى تتزوج وأنت تسأل متى يجي الأكل 🔥'. Always funny, always clear, always screenshot worthy!",
  french:
    "Generate roast in FRENCH language ONLY. 100% French. Do NOT mix in any English, Hindi or other language words or phrases. Pure French vocabulary and grammar.",
  portuguese:
    "Generate roast in PORTUGUESE (Brazilian Portuguese) language ONLY. 100% Portuguese. Do NOT mix in any English or other language words. Pure Portuguese vocabulary and grammar.",
  german:
    "Generate roast in GERMAN language ONLY. 100% Deutsch. Do NOT mix in any English or other language words. Pure German vocabulary and grammar.",
  chinese:
    "Generate roast in SIMPLIFIED CHINESE (普通话) language ONLY, written in Chinese characters. 100% Chinese. Do NOT include any English words, Pinyin, or any other language. Pure Simplified Chinese.",
  urdu:
    "Generate roast in URDU language ONLY, written in proper Urdu Nastaliq script (اردو). Every word must be in Urdu Arabic script — ZERO Roman letters, ZERO English words. CLARITY TEST: Before finalizing, read each line separately — if the meaning is unclear to any ordinary Pakistani, rewrite it simpler. If more than 3 lines, cut immediately. SIMPLE WORDS ONLY — use words a 12-year-old Pakistani understands. GOOD sentence style: 'تیری زندگی خالی ہے' or 'اکیلے اس لیے ہو کہ کوئی پسند نہیں کرتا'. BAD sentence style (NEVER do this): 'کھوئے ہوئے ہاتھ کو لوٹنے کا منشا ہے ہم' or 'ہمیشہ اکیلے ہی سے پہلے وہاں پہنچیں گی' — too confusing, rewrite! STRICT STRUCTURE: Line 1 = NAME + CITY + JOB joke. Line 2 = weakness/status with CITY reference. Line 3 = killer clear punchline. MAX 3 lines. 2-3 emojis inside sentences. Style tones: FRIENDLY→warm friend teasing, ends 😄/😂. SAVAGE→brutal truth stings, ends 💀/🔥. DARK→existential burn, ends 🌑/💀. DESI→aunty/rishta/society pressure, ends 😭/🔥. Examples — FRIENDLY: 'انجم، بینکاک میں اکاؤنٹنٹ ہو / محنتی ہو لیکن زندگی کا حساب ٹھیک کرو 😄 / صحیح بندی آئے گی ضرور 😂'. SAVAGE: 'انجم، بینکاک میں اکاؤنٹنٹ ہو / محبت کا حساب ہمیشہ منفی ہے 💀 / بیوی کا خانہ خالی ہے 🔥'. DARK: 'انجم، بینکاک کی گرمی میں بھی قسمت ٹھنڈی ہے 🌑 / سب کا حساب جانتے ہو / اپنا خسارہ نظر نہیں آتا 💀'. DESI: 'انجم بھائی، گلی کو پتہ ہے بینکاک میں اکاؤنٹنٹ ہو 😭 / آنٹی کو بھی پتہ ہے ابھی تک اکیلے ہو 🔥 / رشتہ آنے سے پہلے حساب ٹھیک کرو 💀'. Screenshot worthy!",
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
    shortId: row.shortId ?? null,
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
        shortId: generateShortId(),
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

router.get("/r/:shortId", async (req, res) => {
  const { shortId } = req.params;
  if (!/^[A-Za-z0-9]{6}$/.test(shortId)) {
    return res.status(404).json({ error: "Not found" });
  }
  const [row] = await db
    .select()
    .from(roastsTable)
    .where(eq(roastsTable.shortId, shortId))
    .limit(1);
  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json(serializeRoast(row));
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
