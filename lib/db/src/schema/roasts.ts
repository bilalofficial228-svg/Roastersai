import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roastsTable = pgTable("roasts", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Legacy "target" kept for backwards-compatible reads of existing rows.
  target: text("target").notNull(),
  style: text("style").notNull(),
  text: text("text").notNull(),
  // Personalized inputs
  name: text("name").notNull().default(""),
  job: text("job").notNull().default("other"),
  city: text("city").notNull().default(""),
  weakness: text("weakness"),
  status: text("status").notNull().default("single"),
  language: text("language").notNull().default("english"),
  intensity: integer("intensity").notNull().default(3),
  // Reaction counters
  hilariousCount: integer("hilarious_count").notNull().default(0),
  savageCount: integer("savage_count").notNull().default(0),
  deadCount: integer("dead_count").notNull().default(0),
  tooRealCount: integer("too_real_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type RoastRow = typeof roastsTable.$inferSelect;
export type InsertRoastRow = typeof roastsTable.$inferInsert;
