const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini AI
console.log("Initializing Gemini AI...");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiVersion: "v1beta", // or "v1beta" depending on what works
});
console.log("Gemini initialized:", genAI ? "Success" : "Failed");

const app = express();
const PORT = process.env.PORT || 5000;
const FEEDBACK_FILE = path.join(__dirname, "feedback.json");

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Initialize feedback file if it doesn't exist
async function initializeFeedbackFile() {
  try {
    await fs.access(FEEDBACK_FILE);
  } catch (error) {
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify([]));
  }
}

// Helper function to read feedback
async function readFeedback() {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write feedback
async function writeFeedback(feedback) {
  await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedback, null, 2));
}

// Routes

// Get all feedback
app.get("/api/feedback", async (req, res) => {
  try {
    const feedback = await readFeedback();
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// Add new feedback
app.post("/api/feedback", async (req, res) => {
  try {
    console.log("Received feedback request:", req.body);
    const { name, email, message, rating } = req.body;

    if (!name || !message) {
      console.log("Validation failed - missing name or message");
      return res.status(400).json({ error: "Name and message are required" });
    }

    const feedback = await readFeedback();
    const newFeedback = {
      id: Date.now(),
      name: name.trim(),
      email: (email || "").trim(),
      message: message.trim(),
      rating: parseInt(rating) || 5,
      timestamp: new Date().toISOString(),
    };

    feedback.push(newFeedback);
    await writeFeedback(feedback);

    console.log("Feedback added successfully:", newFeedback);
    res.status(201).json(newFeedback);
  } catch (error) {
    console.error("Error adding feedback:", error);
    res
      .status(500)
      .json({ error: "Failed to add feedback", details: error.message });
  }
});

// Delete feedback
app.delete("/api/feedback/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const feedback = await readFeedback();
    const filteredFeedback = feedback.filter((item) => item.id !== id);

    if (feedback.length === filteredFeedback.length) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    await writeFeedback(filteredFeedback);
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

// AI Q&A endpoint with Gemini integration
app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("Received question:", question);

    // Immediate fallback if no API key
    if (!process.env.GEMINI_API_KEY) {
      console.log("No Gemini API key found, using local response");
      const localAnswer = await getLocalResponse(question);
      return res.json({ answer: localAnswer, source: "local" });
    }

    // Use the correct model name - try these in order:
    const modelNames = [
      "gemini-1.5-pro-latest", // Most recent model
      "gemini-pro", // Previous stable version
      "models/gemini-pro", // Full path format
    ];

    let lastError = null;

    // Try each model name until one works
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `The user asked: "${question}"
        
        Please provide a helpful, concise answer (max 150 words). 
        If the question is about feedback systems or this application, 
        focus on helpful information. Otherwise, provide a general helpful response.

        Use a friendly tone and emojis where appropriate.`;

        console.log(`Trying model ${modelName} with prompt:`, prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;

        if (!response.text) {
          throw new Error("Empty response from Gemini");
        }

        const answer = response.text();
        console.log("Gemini response:", answer);

        return res.json({ answer, source: "gemini", model: modelName });
      } catch (modelError) {
        console.error(`Failed with model ${modelName}:`, modelError);
        lastError = modelError;
        continue; // Try next model
      }
    }

    // If all models failed
    throw lastError || new Error("All model attempts failed");
  } catch (error) {
    console.error("AI endpoint error:", error);

    // Fallback to local response
    const localAnswer = await getLocalResponse(req.body?.question || "Help");
    res.json({
      answer: localAnswer,
      source: "local-fallback",
      error: error.message,
      note: "Gemini AI failed, using local response",
    });
  }
});

// Local response function (fallback)
async function getLocalResponse(question) {
  const lowerQuestion = question.toLowerCase().trim();

  if (
    lowerQuestion.includes("hello") ||
    lowerQuestion.includes("hi") ||
    lowerQuestion.includes("hey")
  ) {
    return "Hello! 👋 I'm here to help you with the Feedback Tracker app. You can ask me about features, how to use the app, or any general questions!";
  } else if (
    lowerQuestion.includes("what is this") ||
    lowerQuestion.includes("what does this do")
  ) {
    return "This is a Feedback Tracker application! 📝 It allows users to:\n• Submit feedback with ratings (1-5 stars)\n• View all submitted feedback in an organized list\n• Delete feedback when needed\n• Ask questions to this AI assistant (that's me!)";
  } else if (
    lowerQuestion.includes("how to add") ||
    lowerQuestion.includes("submit feedback") ||
    lowerQuestion.includes("add feedback")
  ) {
    return 'To add feedback:\n1. Go to the "Feedback Management" tab\n2. Fill in your name (required) and message (required)\n3. Optionally add your email\n4. Choose a star rating (1-5 stars)\n5. Click "Submit Feedback"\n\nThe feedback will appear in the list on the right side! ✨';
  } else if (
    lowerQuestion.includes("delete") ||
    lowerQuestion.includes("remove")
  ) {
    return "To delete feedback:\n1. Look for the 🗑️ trash icon next to any feedback item\n2. Click on it\n3. Confirm the deletion in the popup\n\nThe feedback will be permanently removed from the list.";
  } else if (
    lowerQuestion.includes("feature") ||
    lowerQuestion.includes("what can")
  ) {
    return "Key features of this app:\n🔹 **Feedback Management**: Add, view, and delete user feedback\n🔹 **Star Ratings**: 5-star rating system for feedback\n🔹 **Responsive Design**: Works on desktop and mobile\n🔹 **Real-time Updates**: No page refresh needed\n🔹 **AI Assistant**: Ask questions (that's me!)\n🔹 **Data Persistence**: Feedback is saved between sessions";
  } else {
    return `I understand you're asking about "${question}". This is a feedback tracking application with AI assistance. Try asking about app features, how to use it, or any general questions! 🤔`;
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await initializeFeedbackFile();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
