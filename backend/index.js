const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini AI with better error handling
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Gemini initialized successfully");
  } else {
    console.warn(
      "⚠️ GEMINI_API_KEY not found - AI features will use fallback responses"
    );
  }
} catch (error) {
  console.error("Failed to initialize Gemini AI:", error.message);
}

const app = express();
const PORT = process.env.PORT || 5000;
const FEEDBACK_FILE = path.join(__dirname, "feedback.json");

// Enhanced CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Initialize feedback file with better structure
async function initializeFeedbackFile() {
  try {
    await fs.access(FEEDBACK_FILE);
  } catch (error) {
    const initialData = {
      feedback: [],
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0",
      },
    };
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Enhanced feedback reading with validation
async function readFeedback() {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, "utf8");
    const parsed = JSON.parse(data);

    // Handle both old and new format
    if (Array.isArray(parsed)) {
      // Old format - migrate to new structure
      const newFormat = {
        feedback: parsed,
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: "1.0",
        },
      };
      await writeFeedback(newFormat.feedback);
      return newFormat.feedback;
    }

    return parsed.feedback || [];
  } catch (error) {
    console.error("Failed to read feedback:", error.message);
    return [];
  }
}

// Enhanced feedback writing with metadata
async function writeFeedback(feedback) {
  const data = {
    feedback,
    metadata: {
      lastModified: new Date().toISOString(),
      version: "1.0",
      count: feedback.length,
    },
  };
  await fs.writeFile(FEEDBACK_FILE, JSON.stringify(data, null, 2));
}

// Input validation middleware
function validateFeedbackInput(req, res, next) {
  const { name, message, rating } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Name is required and cannot be empty",
      field: "name",
    });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({
      error: "Message is required and cannot be empty",
      field: "message",
    });
  }

  if (name.trim().length > 100) {
    return res.status(400).json({
      error: "Name must be less than 100 characters",
      field: "name",
    });
  }

  if (message.trim().length > 1000) {
    return res.status(400).json({
      error: "Message must be less than 1000 characters",
      field: "message",
    });
  }

  if (rating && (isNaN(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({
      error: "Rating must be between 1 and 5",
      field: "rating",
    });
  }

  next();
}

// Routes

// Get all feedback with pagination and filtering
app.get("/api/feedback", async (req, res) => {
  try {
    const feedback = await readFeedback();
    const { page = 1, limit = 10, rating, search } = req.query;

    let filteredFeedback = [...feedback];

    // Filter by rating if specified
    if (rating) {
      filteredFeedback = filteredFeedback.filter(
        (item) => item.rating === parseInt(rating)
      );
    }

    // Search in name and message if specified
    if (search) {
      const searchLower = search.toLowerCase();
      filteredFeedback = filteredFeedback.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.message.toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    filteredFeedback.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

    res.json({
      feedback: paginatedFeedback,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredFeedback.length / limit),
        totalItems: filteredFeedback.length,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      error: "Failed to fetch feedback",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Add new feedback with enhanced validation
app.post("/api/feedback", validateFeedbackInput, async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;

    const feedback = await readFeedback();
    const newFeedback = {
      id: Date.now().toString(),
      name: name.trim(),
      email: (email || "").trim(),
      message: message.trim(),
      rating: parseInt(rating) || 5,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip || "unknown",
    };

    feedback.push(newFeedback);
    await writeFeedback(feedback);

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: newFeedback,
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({
      error: "Failed to add feedback",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update existing feedback
app.put("/api/feedback/:id", validateFeedbackInput, async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, message, rating } = req.body;

    const feedback = await readFeedback();
    const feedbackIndex = feedback.findIndex((item) => item.id === id);

    if (feedbackIndex === -1) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Update the feedback
    feedback[feedbackIndex] = {
      ...feedback[feedbackIndex],
      name: name.trim(),
      email: (email || "").trim(),
      message: message.trim(),
      rating: parseInt(rating) || feedback[feedbackIndex].rating,
      lastModified: new Date().toISOString(),
    };

    await writeFeedback(feedback);

    res.json({
      message: "Feedback updated successfully",
      feedback: feedback[feedbackIndex],
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ error: "Failed to update feedback" });
  }
});

// Delete feedback with better error handling
app.delete("/api/feedback/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const feedback = await readFeedback();
    const filteredFeedback = feedback.filter((item) => item.id !== id);

    if (feedback.length === filteredFeedback.length) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    await writeFeedback(filteredFeedback);
    res.json({
      message: "Feedback deleted successfully",
      deletedId: id,
      remainingCount: filteredFeedback.length,
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

// Enhanced AI Q&A endpoint with better model handling
app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Immediate fallback if no Gemini instance
    if (!genAI) {
      const localAnswer = await getLocalResponse(question);
      return res.json({ answer: localAnswer, source: "local" });
    }

    // Enhanced model selection with more options
    const modelNames = [
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro",
      "models/gemini-pro",
    ];

    let lastError = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `You are a helpful AI assistant for a feedback management application. 

User question: "${question}"

Guidelines:
- Provide helpful, concise answers (max 150 words)
- Use a friendly, professional tone
- Include relevant emojis where appropriate
- If the question is about feedback systems, focus on practical advice
- For general questions, provide informative responses
- Be encouraging and supportive

Please respond helpfully:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        if (!response.text) {
          throw new Error("Empty response from Gemini");
        }

        const answer = response.text();

        return res.json({
          answer,
          source: "gemini",
          model: modelName,
          timestamp: new Date().toISOString(),
        });
      } catch (modelError) {
        console.error(`Model ${modelName} failed:`, modelError.message);
        lastError = modelError;
        continue;
      }
    }

    // If all models failed, use fallback
    throw lastError || new Error("All model attempts failed");
  } catch (error) {
    console.error("Error in AI endpoint:", error);
    // Enhanced fallback response
    const localAnswer = await getLocalResponse(req.body?.question || "Help");
    res.json({
      answer: localAnswer,
      source: "local-fallback",
      note: "AI service temporarily unavailable, using local response",
      timestamp: new Date().toISOString(),
    });
  }
});

// Enhanced local response function with more comprehensive answers
async function getLocalResponse(question) {
  const lowerQuestion = question.toLowerCase().trim();

  const responses = {
    greeting: () =>
      "Hello! 👋 I'm your feedback management assistant. I can help you understand how to use this app, explain features, or answer general questions!",

    whatIsThis: () =>
      "This is a **Feedback Tracker Application**! 📝\n\n**Key Features:**\n• Submit feedback with star ratings (1-5 ⭐)\n• View and manage all feedback entries\n• Search and filter feedback\n• Delete unwanted entries\n• AI-powered Q&A assistance\n• Real-time updates without page refresh",

    howToAdd: () =>
      "**To submit feedback:** ✨\n1. Navigate to the 'Feedback Management' section\n2. Fill in your name (required)\n3. Write your message (required)\n4. Add email (optional)\n5. Select rating (1-5 stars)\n6. Click 'Submit Feedback'\n\nYour feedback will appear instantly in the list!",

    howToDelete: () =>
      "**To delete feedback:** 🗑️\n1. Find the feedback item in the list\n2. Click the trash icon (🗑️) next to it\n3. Confirm deletion in the popup\n\n*Note: Deletion is permanent and cannot be undone.*",

    features: () =>
      "**App Features:** 🚀\n\n🔹 **Feedback Management**: Add, edit, view, delete\n🔹 **Star Ratings**: 1-5 star rating system\n🔹 **Search & Filter**: Find specific feedback\n🔹 **Responsive Design**: Works on all devices\n🔹 **Data Persistence**: Feedback saved permanently\n🔹 **AI Assistant**: Get help anytime (that's me!)\n🔹 **Real-time Updates**: No page refresh needed",

    general: (q) =>
      `I understand you're asking about "${q}". I'm here to help with the feedback tracker app! 🤔\n\n**Try asking about:**\n• How to use features\n• App capabilities\n• Technical questions\n• General assistance\n\nWhat would you like to know?`,
  };

  // Enhanced pattern matching
  if (/\b(hello|hi|hey|greetings)\b/i.test(lowerQuestion)) {
    return responses.greeting();
  } else if (
    /\b(what is|what does|about this|describe)\b/i.test(lowerQuestion)
  ) {
    return responses.whatIsThis();
  } else if (
    /\b(how to add|submit|add feedback|create)\b/i.test(lowerQuestion)
  ) {
    return responses.howToAdd();
  } else if (/\b(delete|remove|trash)\b/i.test(lowerQuestion)) {
    return responses.howToDelete();
  } else if (
    /\b(features|capabilities|what can|functions)\b/i.test(lowerQuestion)
  ) {
    return responses.features();
  } else {
    return responses.general(question);
  }
}

// Get app statistics
app.get("/api/stats", async (req, res) => {
  try {
    const feedback = await readFeedback();

    const stats = {
      totalFeedback: feedback.length,
      averageRating:
        feedback.length > 0
          ? (
              feedback.reduce((sum, item) => sum + item.rating, 0) /
              feedback.length
            ).toFixed(1)
          : 0,
      ratingDistribution: {
        1: feedback.filter((item) => item.rating === 1).length,
        2: feedback.filter((item) => item.rating === 2).length,
        3: feedback.filter((item) => item.rating === 3).length,
        4: feedback.filter((item) => item.rating === 4).length,
        5: feedback.filter((item) => item.rating === 5).length,
      },
      recentFeedbackCount: feedback.filter((item) => {
        const feedbackDate = new Date(item.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return feedbackDate > weekAgo;
      }).length,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Health check with more detailed information
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    geminiAvailable: !!genAI,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  // Check if response was already sent
  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  // Check if response was already sent
  if (res.headersSent) {
    return;
  }

  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
    method: req.method,
  });
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initializeFeedbackFile();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Feedback file: ${FEEDBACK_FILE}`);
      console.log(`🤖 Gemini AI: ${genAI ? "Available" : "Unavailable"}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error.message);
    process.exit(1);
  }
}

startServer();
