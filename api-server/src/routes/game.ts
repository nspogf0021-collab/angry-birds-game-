import { Router, type Request } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env["SESSION_SECRET"] || "angry-birds-secret-key";

// TEMP STORAGE
let users: any[] = [];
let unlockedBirds: any[] = [];
let levelScores: any[] = [];

// AUTH
function getUserFromRequest(req: Request): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);
    const payload: any = jwt.verify(token, JWT_SECRET);
    return payload.userId;
  } catch {
    return null;
  }
}

// SHOP DATA
const SHOP_BIRDS = [
  { id: "blue", cost: 50 },
  { id: "yellow", cost: 100 },
  { id: "black", cost: 150 },
  { id: "white", cost: 200 },
  { id: "green", cost: 250 },
  { id: "bigred", cost: 300 },
  { id: "orange", cost: 400 },
];

// GET SHOP
router.get("/shop", (_req, res) => {
  res.json({ items: SHOP_BIRDS });
});

// BUY BIRD
router.post("/shop/purchase", (req, res) => {
  const userId = getUserFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { itemId } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: "User not found" });

  const item = SHOP_BIRDS.find(b => b.id === itemId);
  if (!item) return res.status(400).json({ error: "Item not found" });

  const already = unlockedBirds.find(b => b.userId === userId && b.birdId === itemId);
  if (already) return res.status(400).json({ error: "Already owned" });

  if (user.coins < item.cost) {
    return res.status(400).json({ error: "Not enough coins" });
  }

  user.coins -= item.cost;
  unlockedBirds.push({ userId, birdId: itemId });

  res.json({
    success: true,
    remainingCoins: user.coins,
    unlockedBirds: unlockedBirds.filter(b => b.userId === userId).map(b => b.birdId),
  });
});

// GET PROGRESS
router.get("/progress", (req, res) => {
  const userId = getUserFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: "User not found" });

  const scores = levelScores.filter(s => s.userId === userId);

  res.json({
    userId,
    highestLevel: user.highestLevel || 1,
    coins: user.coins || 0,
    totalScore: user.totalScore || 0,
    levelScores: scores,
    unlockedBirds: unlockedBirds.filter(b => b.userId === userId).map(b => b.birdId),
  });
});

// UPDATE PROGRESS
router.put("/progress", (req, res) => {
  const userId = getUserFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { level, score, stars, coinsEarned } = req.body;

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: "User not found" });

  levelScores.push({ userId, level, score, stars });

  user.coins += coinsEarned;
  user.totalScore += score;
  user.highestLevel = Math.max(user.highestLevel || 1, level + 1);

  res.json({
    userId,
    highestLevel: user.highestLevel,
    coins: user.coins,
    totalScore: user.totalScore,
    levelScores: levelScores.filter(s => s.userId === userId),
    unlockedBirds: unlockedBirds.filter(b => b.userId === userId).map(b => b.birdId),
  });
});

// LEADERBOARD
router.get("/leaderboard", (_req, res) => {
  const sorted = [...users].sort((a, b) => b.totalScore - a.totalScore);

  const entries = sorted.slice(0, 20).map((u, i) => ({
    rank: i + 1,
    username: u.username,
    totalScore: u.totalScore,
    highestLevel: u.highestLevel,
  }));

  res.json({ entries });
});

export default router;
