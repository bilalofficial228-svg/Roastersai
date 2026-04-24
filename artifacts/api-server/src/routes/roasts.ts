import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, roastsTable } from "@workspace/db";
import { GenerateRoastBody } from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router: IRouter = Router();

type RoastStyle = "friendly" | "savage" | "dark" | "desi";

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

const SYSTEM_PROMPT = `You are Roastify — a savage AI comedian that writes short, hilarious roasts.

Hard rules:
- Output ONLY the roast text. No preface, no quotes, no explanations, no hashtags, no emojis.
- Maximum 2 short sentences. Punchy and shareable.
- Funny first, mean second. Always clever, never lazy.
- Never use slurs, sexual content, or attacks on protected classes (race, religion, gender, sexuality, disability, nationality).
- Never threaten, encourage self-harm, or include real personal info (addresses, phone numbers).
- If the target is a public figure or controversial topic, keep it about the bit and avoid defamation.
- Tease the *vibe* of the input — names, jobs, hobbies, scenarios — not deeply personal traits.`;

async function generateRoastText(target: string, style: RoastStyle): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Roast this in the "${style}" style.\n\nStyle direction: ${STYLE_PROMPTS[style]}\n\nTarget to roast: """${target}"""`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new Error("Empty AI response");
  }
  // Strip surrounding quotes if the model added them.
  return text.replace(/^["'`]+|["'`]+$/g, "").trim();
}

router.post("/roasts/generate", async (req, res) => {
  const parsed = GenerateRoastBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.issues });
  }

  const { target, style } = parsed.data;

  try {
    const text = await generateRoastText(target, style as RoastStyle);

    const [row] = await db
      .insert(roastsTable)
      .values({ target, style, text })
      .returning();

    if (!row) {
      throw new Error("Failed to persist roast");
    }

    return res.json({
      id: row.id,
      text: row.text,
      style: row.style,
      target: row.target,
      createdAt: row.createdAt.toISOString(),
    });
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

  res.json(
    rows.map((row) => ({
      id: row.id,
      text: row.text,
      style: row.style,
      target: row.target,
      createdAt: row.createdAt.toISOString(),
    })),
  );
});

// Stable but lively-looking counters. We anchor totals on the real DB count
// and add a deterministic time-based drift so the numbers feel alive.
router.get("/roasts/stats", async (_req, res) => {
  const rows = await db.select({ id: roastsTable.id }).from(roastsTable);
  const realTotal = rows.length;

  const epochDays = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const minutesToday = Math.floor(
    (Date.now() % (1000 * 60 * 60 * 24)) / (1000 * 60),
  );

  const baseTotal = 12_847;
  const dailyDrift = epochDays * 137;
  const minuteDrift = minutesToday * 3;
  const totalRoasts = baseTotal + dailyDrift + minuteDrift + realTotal;

  const usersToday = 820 + Math.floor(minutesToday * 1.4) + realTotal;
  const roastsPerMinute = 6 + (minutesToday % 9);

  res.json({ totalRoasts, usersToday, roastsPerMinute });
});

export default router;
