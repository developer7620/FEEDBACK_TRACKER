import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://localhost:5001/api";

function App() {
  const [feedback, setFeedback] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    rating: 5,
  });
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState("local");
  const [activeTab, setActiveTab] = useState("feedback");

  // Fetch feedback on component mount
  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await axios.get(`${API_BASE}/feedback`);
      setFeedback(response.data.feedback);
      console.log("Feedback fetched successfully:", response.data);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      if (error.request) {
        console.error("Cannot connect to backend server");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.message.trim()) {
      alert("Please fill in both name and message fields");
      return;
    }

    console.log("Submitting feedback:", formData);

    try {
      const response = await axios.post(`${API_BASE}/feedback`, formData);
      console.log("Feedback submitted successfully:", response.data);
      setFormData({ name: "", email: "", message: "", rating: 5 });
      fetchFeedback();
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error submitting feedback:", error);

      if (error.response) {
        // Server responded with error status
        console.error("Server error:", error.response.data);
        alert(
          `Failed to submit feedback: ${
            error.response.data.error || "Server error"
          }`
        );
      } else if (error.request) {
        // Request was made but no response received
        console.error("Network error:", error.request);
        alert(
          "Failed to submit feedback: Cannot connect to server. Make sure the backend is running on http://localhost:5000"
        );
      } else {
        // Something else happened
        console.error("Unknown error:", error.message);
        alert("Failed to submit feedback: Unknown error occurred");
      }
    }
  };

  const deleteFeedback = async (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        await axios.delete(`${API_BASE}/feedback/${id}`);
        fetchFeedback();
      } catch (error) {
        alert("Failed to delete feedback");
      }
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ask`, { question });
      setAnswer(response.data.answer);
      // Check if response seems to be from Gemini (longer, more natural responses)
      if (
        response.data.answer.length > 100 &&
        !response.data.answer.includes("Try asking:")
      ) {
        setAiStatus("gemini");
      } else {
        setAiStatus("local");
      }
    } catch (error) {
      setAnswer(
        "Sorry, I encountered an error while processing your question."
      );
      setAiStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Feedback Tracker</h1>
        <p>Collect and manage user feedback with AI-powered Q&A</p>
      </header>

      <nav className="nav-tabs">
        <button
          className={activeTab === "feedback" ? "active" : ""}
          onClick={() => setActiveTab("feedback")}
        >
          Feedback Management
        </button>
        <button
          className={activeTab === "ai" ? "active" : ""}
          onClick={() => setActiveTab("ai")}
        >
          AI Assistant
        </button>
      </nav>

      {activeTab === "feedback" && (
        <div className="feedback-section">
          <div className="form-container">
            <h2>Submit Feedback</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Rating</label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4)</option>
                  <option value={3}>⭐⭐⭐ (3)</option>
                  <option value={2}>⭐⭐ (2)</option>
                  <option value={1}>⭐ (1)</option>
                </select>
              </div>

              <button type="submit" className="submit-btn">
                Submit Feedback
              </button>
            </form>
          </div>

          <div className="feedback-list">
            <h2>All Feedback ({feedback.length})</h2>
            {feedback.length === 0 ? (
              <p className="no-feedback">
                No feedback yet. Be the first to share!
              </p>
            ) : (
              feedback.map((item) => (
                <div key={item.id} className="feedback-item">
                  <div className="feedback-header">
                    <strong>{item.name}</strong>
                    <span className="rating">{"⭐".repeat(item.rating)}</span>
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                  <p>{item.message}</p>
                  <small>
                    {item.email && `${item.email} • `}
                    {new Date(item.timestamp).toLocaleDateString()}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="ai-section">
          <div className="ai-header">
            <h2>🤖 AI Assistant</h2>
            <div className="ai-status">
              {aiStatus === "gemini" && (
                <span className="status-badge gemini">
                  ⚡ Powered by Gemini AI
                </span>
              )}
              {aiStatus === "local" && (
                <span className="status-badge local">🔧 Local Responses</span>
              )}
              {aiStatus === "error" && (
                <span className="status-badge error">❌ Error</span>
              )}
            </div>
          </div>
          <p>Ask me anything about this app or general questions!</p>

          <div className="question-container">
            <div className="question-input">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question here..."
                onKeyPress={(e) => e.key === "Enter" && askQuestion()}
              />
              <button
                onClick={askQuestion}
                disabled={loading || !question.trim()}
                className="ask-btn"
              >
                {loading ? "🤔" : "🚀"} Ask
              </button>
            </div>

            {answer && (
              <div className="answer-container">
                <h3>💡 Answer:</h3>
                <p>{answer}</p>
              </div>
            )}
          </div>

          <div className="example-questions">
            <h3>Try asking:</h3>
            <div className="example-buttons">
              <button onClick={() => setQuestion("What is this app?")}>
                What is this app?
              </button>
              <button onClick={() => setQuestion("How do I add feedback?")}>
                How do I add feedback?
              </button>
              <button
                onClick={() => setQuestion("What features are available?")}
              >
                What features are available?
              </button>
              <button onClick={() => setQuestion("How do I delete feedback?")}>
                How do I delete feedback?
              </button>
              <button onClick={() => setQuestion("What is Java?")}>
                What is Java?
              </button>
              <button onClick={() => setQuestion("How does this app work?")}>
                How does this app work?
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
