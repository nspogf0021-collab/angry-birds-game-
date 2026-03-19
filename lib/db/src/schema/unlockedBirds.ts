import { pgTable, integer, text, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const unlockedBirdsTable = pgTable("unlocked_birds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  birdId: text("bird_id").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
}, (t) => ({
  unique: unique().on(t.userId, t.birdId),
}));

export const insertUnlockedBirdSchema = createInsertSchema(unlockedBirdsTable).omit({ id: true, unlockedAt: true });
export type InsertUnlockedBird = z.infer<typeof insertUnlockedBirdSchema>;
export type UnlockedBird = typeof unlockedBirdsTable.$inferSelect;
