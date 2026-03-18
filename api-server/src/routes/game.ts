import { Router, type IRouter, type Request } from "express";
import { db } from "@workspace/db";
import { usersTable, levelScoresTable, unlockedBirdsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env["SESSION_SECRET"] || "angry-birds-secret-key";

async function getUserFromRequest(req: Request): Promise<number | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    return payload.userId;
  } catch {
    return null;
  }
}

const SHOP_BIRDS = [
  {
    id: "blue",
    name: "Blue Bird",
    description: "Splits into 3 birds on tap",
    cost: 50,
    emoji: "💙",
    color: "#4FC3F7",
    ability: "Triple Split",
  },
  {
    id: "yellow",
    name: "Yellow Bird",
    description: "Blazing speed boost on tap",
    cost: 100,
    emoji: "💛",
    color: "#FFD54F",
    ability: "Speed Boost",
  },
  {
    id: "black",
    name: "Bomb Bird",
    description: "Explodes on tap or impact",
    cost: 150,
    emoji: "🖤",
    color: "#424242",
    ability: "Explosion",
  },
  {
    id: "white",
    name: "Matilda",
    description: "Drops egg bomb downward on tap",
    cost: 200,
    emoji: "🤍",
    color: "#ECEFF1",
    ability: "Egg Drop",
  },
  {
    id: "green",
    name: "Hal",
    description: "Boomerang curves back on tap",
    cost: 250,
    emoji: "💚",
    color: "#66BB6A",
    ability: "Boomerang",
  },
  {
    id: "bigred",
    name: "Terence",
    description: "Massive bird, massive damage",
    cost: 300,
    emoji: "❤️",
    color: "#EF5350",
    ability: "Super Strength",
  },
  {
    id: "orange",
    name: "Bubbles",
    description: "Inflates to giant size on tap",
    cost: 400,
    emoji: "🧡",
    color: "#FFA726",
    ability: "Inflation",
  },
];

router.get("/shop", (_req, res) => {
  return res.json({ items: SHOP_BIRDS });
});

router.post("/shop/purchase", async (req, res) => {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { itemId } = req.body;
    const item = SHOP_BIRDS.find((b) => b.id === itemId);

    if (!item) {
      return res.status(400).json({ error: "Item not found" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const existing = await db.select().from(unlockedBirdsTable)
      .where(eq(unlockedBirdsTable.userId, userId))
      .then((rows) => rows.find((r) => r.birdId === itemId));

    if (existing) {
      return res.status(400).json({ error: "Bird already owned" });
    }

    if (user.coins < item.cost) {
      return res.status(400).json({ error: "Insufficient coins" });
    }

    await db.update(usersTable)
      .set({ coins: user.coins - item.cost })
      .where(eq(usersTable.id, userId));

    await db.insert(unlockedBirdsTable).values({
      userId,
      birdId: itemId,
    });

    const unlockedRows = await db.select().from(unlockedBirdsTable)
      .where(eq(unlockedBirdsTable.userId, userId));

    return res.json({
      success: true,
      remainingCoins: user.coins - item.cost,
      unlockedBirds: unlockedRows.map((r) => r.birdId),
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/progress", async (req, res) => {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const scores = await db.select().from(levelScoresTable)
      .where(eq(levelScoresTable.userId, userId));

    const unlockedRows = await db.select().from(unlockedBirdsTable)
      .where(eq(unlockedBirdsTable.userId, userId));

    return res.json({
      userId: user.id,
      highestLevel: user.highestLevel,
      coins: user.coins,
      totalScore: user.totalScore,
      levelScores: scores.map((s) => ({
        level: s.level,
        stars: s.stars,
        score: s.score,
      })),
      unlockedBirds: unlockedRows.map((r) => r.birdId),
    });
  } catch (error) {
    console.error("Progress error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/progress", async (req, res) => {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { level, score, stars, coinsEarned } = req.body;

    if (!level || score === undefined || stars === undefined || coinsEarned === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check existing score
    const existingScores = await db.select().from(levelScoresTable)
      .where(eq(levelScoresTable.userId, userId));
    const existing = existingScores.find((s) => s.level === level);

    if (existing) {
      if (score > existing.score) {
        await db.update(levelScoresTable)
          .set({ score, stars: Math.max(existing.stars, stars), updatedAt: new Date() })
          .where(eq(levelScoresTable.id, existing.id));
      }
    } else {
      await db.insert(levelScoresTable).values({
        userId,
        level,
        score,
        stars,
      });
    }

    // Update user: coins, total score, highest level
    const newCoins = user.coins + coinsEarned;
    const newTotalScore = user.totalScore + score;
    const newHighestLevel = Math.max(user.highestLevel, level + 1);

    await db.update(usersTable).set({
      coins: newCoins,
      totalScore: newTotalScore,
      highestLevel: newHighestLevel,
    }).where(eq(usersTable.id, userId));

    const updatedScores = await db.select().from(levelScoresTable)
      .where(eq(levelScoresTable.userId, userId));

    const unlockedRows = await db.select().from(unlockedBirdsTable)
      .where(eq(unlockedBirdsTable.userId, userId));

    return res.json({
      userId,
      highestLevel: newHighestLevel,
      coins: newCoins,
      totalScore: newTotalScore,
      levelScores: updatedScores.map((s) => ({
        level: s.level,
        stars: s.stars,
        score: s.score,
      })),
      unlockedBirds: unlockedRows.map((r) => r.birdId),
    });
  } catch (error) {
    console.error("Update progress error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard", async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      totalScore: usersTable.totalScore,
      highestLevel: usersTable.highestLevel,
    }).from(usersTable)
      .orderBy(desc(usersTable.totalScore))
      .limit(20);

    const entries = users.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      totalScore: u.totalScore,
      highestLevel: u.highestLevel,
    }));

    return res.json({ entries });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
