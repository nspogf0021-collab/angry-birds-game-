
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env["SESSION_SECRET"] || "angry-birds-secret-key";

// TEMP STORAGE (no database)
let users: any[] = [];
let userIdCounter = 1;

// Generate token
function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingEmail = users.find(u => u.email === email);
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const existingUsername = users.find(u => u.username === username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: userIdCounter++,
      username,
      email,
      passwordHash,
      coins: 100,
      totalScore: 0,
      createdAt: new Date(),
    };

    users.push(newUser);

    const token = generateToken(newUser.id);

    return res.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        coins: newUser.coins,
        totalScore: newUser.totalScore,
        createdAt: newUser.createdAt.toISOString(),
      },
      token,
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);

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

// LOGOUT
router.post("/logout", (_req, res) => {
  return res.json({ success: true });
});

// GET USER
router.get("/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.slice(7);

    let payload: any;

    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = users.find(u => u.id === payload.userId);

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
