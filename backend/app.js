import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import multer from "multer";
import { convert } from "@opendataloader/pdf";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  fileSize: 50 * 1024 * 1024,
}); // 50MB limit
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

function chunkText(text, wordsPerChunk = 200) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks = [];
  console.log(`Total words extracted: ${words.length}`);

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }

  return chunks;
}

async function requireSupabaseAuth(req, res, next) {
  if (!supabase) {
    return res.status(500).json({
      error:
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).",
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing JWT token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = data.user;
  return next();
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SpeedReading backend is running",
    status: "ok",
  });
});

app.post(
  "/extract-text",
  requireSupabaseAuth,
  upload.single("file"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (file.mimetype !== "application/pdf") {
      return res.status(415).json({ error: "Only PDF files are supported" });
    }
    const hello = await processPdfBytes(file.buffer, file.originalname)
    console.log("Extracted content:", hello);
  },
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function processPdfBytes(buffer, filename, format = "text") {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "speedreading-pdf-"));

  try {
    const safeFilename = `${crypto.randomUUID()}-${
      path.basename(`${filename}.txt`) || "document.pdf"
    }`;

    const filepath = path.join(tmpDir, safeFilename);
    await fs.writeFile(filepath, Buffer.from(buffer));

    const x = await convert([filepath], {
      outputDir: tmpDir,
      format: format,
    });

    console.log(`Extracted text for ${filename}:`, x);
    return x;
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);
  }
}
