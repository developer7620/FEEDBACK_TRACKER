# 📝 Feedback Tracker Application

A modern, full-featured feedback management system built with **Node.js** and **Express**, featuring **AI-powered assistance** through Google's **Gemini AI**.

---

## ✨ Features

- 📊 **Feedback Management**: Create, read, update, and delete feedback entries  
- ⭐ **Star Rating System**: 1–5 star rating system for feedback  
- 🔍 **Search & Filter**: Find specific feedback by content or rating  
- 📱 **Responsive Design**: Works seamlessly across all devices  
- 🤖 **AI Assistant**: Get help with Google Gemini AI integration  
- 📈 **Analytics**: View feedback statistics and rating distributions  
- 🔄 **Real-time Updates**: No page refresh needed for operations  
- 💾 **Data Persistence**: Feedback stored in JSON format  

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)  
- npm or yarn  
- Google Gemini API key (optional, for AI features)  

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/feedback-tracker.git
cd feedback-tracker

# Install dependencies
npm install

cp .env.example .env
setup .env file =>

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_actual_api_key_here

# For production
npm start

# For development with auto-restart
npm run dev

Request Examples
Create Feedback

curl -X POST http://localhost:5000/api/feedback \
-H "Content-Type: application/json" \
-d '{ "name": "John Doe", "email": "john@example.com", "message": "Great service!", "rating": 5 }'


Ask AI Assistant

curl -X POST http://localhost:5000/api/ask \
-H "Content-Type: application/json" \
-d '{ "question": "How do I delete feedback?" }'

Getting Gemini API Key
Visit Google AI Studio

Create a new API key

Add it to your .env file

feedback-tracker/
├── backend/              # Backend server (Node.js/Express)
│   ├── index.js          # Main server file
│   ├── feedback.json     # Data storage (auto-generated)
│   ├── package.json      # Backend dependencies
│   ├── .env              # Environment variables (not committed)
│   ├── .env.example      # Environment template
│   └── node_modules/
├── frontend/             # Frontend application
│   ├── src/              # Source files
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   ├── index.html        # Main HTML file
│   ├── vite.config.js    # Vite configuration
│   └── node_modules/
├── .gitignore
└── README.md

🔧 Development

Backend=>

cd backend

# Start production server
npm start

# Start development server with auto-restart
npm run dev

# Run tests (if implemented)
npm test

Frontend=>

cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (if implemented)
npm test


Data Storage =>
{
  "feedback": [
    {
      "id": "1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Great service!",
      "rating": 5,
      "timestamp": "2024-01-01T00:00:00.000Z",
      "ipAddress": "127.0.0.1"
    }
  ],
  "metadata": {
    "lastModified": "2024-01-01T00:00:00.000Z",
    "version": "1.0",
    "count": 1
  }
}

🔒 Security Features
Input validation and sanitization

CORS protection

Rate limiting ready

Error handling without sensitive data exposure

IP address logging for analytics

🤝 Contributing
Fork the repository

Create your feature branch: git checkout -b feature/AmazingFeature

Commit your changes: git commit -m 'Add some AmazingFeature'

Push to the branch: git push origin feature/AmazingFeature

Open a Pull Request

📝 License
This project is licensed under the MIT License — see the LICENSE file for details.

🐛 Troubleshooting
Server won't start
Check if port 5000 is available

Verify Node.js version (v14+)

Install dependencies: npm install

AI features not working
Check GEMINI_API_KEY in .env

Make sure the API key is valid

App uses fallback if AI is unavailable

CORS errors
Update FRONTEND_URL in .env

Check CORS setup in index.js

🎯 Roadmap
 User authentication

 Email notifications

 Advanced analytics dashboard

 Export functionality (CSV, PDF)

 Real-time notifications

 Multiple feedback categories

 File attachment support


Made with ❤️ by ADITYA BHIMANWAR
