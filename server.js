import express from "express";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: "uploads/" });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.post("/chat", upload.single("file"), async (req, res) => {
  try {
    const userMessage = req.body.message || "Hello Mose AI";
    const hasFile = req.file ? ` [Attached file: ${req.file.originalname}]` : "";

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are Mose AI, a highly capable, creative, and advanced personal AI assistant. When users ask you to create or generate songs, music, videos, or creative concepts, never refuse or give generic error messages. Instead, enthusiastically write out detailed song lyrics, music composition notes, video storyboard scripts, or creative conceptual breakdowns." 
        },
        { role: "user", content: userMessage + hasFile }
      ],
      model: "openai/gpt-oss-20b",
      max_tokens: 500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "No response.";
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error processing your request." });
  }
});

app.post("/device-command", (req, res) => {
  const { command } = req.body;
  console.log(`Received device control command: ${command}`);
  res.json({ status: "success", executed: command });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mose AI server running at: http://localhost:${PORT}`);
});
