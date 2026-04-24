import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roastsTable = pgTable("roasts", {
  id: uuid("id").defaultRandom().primaryKey(),
  target: text("target").notNull(),
  style: text("style").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type RoastRow = typeof roastsTable.$inferSelect;
export type InsertRoastRow = typeof roastsTable.$inferInsert;
