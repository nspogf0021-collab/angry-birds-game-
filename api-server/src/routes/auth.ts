import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, unlockedBirdsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

const JWT_SECRET = process.env["SESSION_SECRET"] || "angry-birds-secret-key";
const DEFAULT_BIRDS = ["red"];

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await db.select().from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const existingUsername = await db.select().from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash,
      coins: 100,
      totalScore: 0,
      highestLevel: 1,
    }).returning();

    // Unlock red bird by default
    await db.insert(unlockedBirdsTable).values({
      userId: user.id,
      birdId: "red",
    });

    const token = generateToken(user.id);

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        totalScore: user.totalScore,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id);

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        totalScore: user.totalScore,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (_req, res) => {
  return res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.slice(7);
    let payload: { userId: number };

    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      totalScore: user.totalScore,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
