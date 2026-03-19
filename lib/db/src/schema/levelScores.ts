import { pgTable, integer, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const levelScoresTable = pgTable("level_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  stars: integer("stars").notNull().default(0),
  score: integer("score").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  unique: unique().on(t.userId, t.level),
}));

export const insertLevelScoreSchema = createInsertSchema(levelScoresTable).omit({ id: true, updatedAt: true });
export type InsertLevelScore = z.infer<typeof insertLevelScoreSchema>;
export type LevelScore = typeof levelScoresTable.$inferSelect;
