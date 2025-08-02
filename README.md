📝 Feedback Tracker Application
A modern, full-featured feedback management system built with Node.js and Express, featuring AI-powered assistance through Google's Gemini AI.
✨ Features

📊 Feedback Management: Create, read, update, and delete feedback entries
⭐ Star Rating System: 1-5 star rating system for feedback
🔍 Search & Filter: Find specific feedback by content or rating
📱 Responsive Design: Works seamlessly across all devices
🤖 AI Assistant: Get help with Google Gemini AI integration
📈 Analytics: View feedback statistics and rating distributions
🔄 Real-time Updates: No page refresh needed for operations
💾 Data Persistence: Feedback stored in JSON format

🚀 Quick Start
Prerequisites

Node.js (v14 or higher)
npm or yarn
Google Gemini API key (optional, for AI features)

Installation

Clone the repository
bash
git clone https://github.com/yourusername/feedback-tracker.git
cd feedback-tracker

Install dependencies
bash
npm install

Set up environment variables
bash
cp .env.example .env
Edit .env and add your configuration:
envPORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_actual_api_key_here

Start the server
bash
npm start
For development with auto-restart:
bash
npm run dev


The server will start at http://localhost:5000


📚 API Documentation
Feedback Endpoints
MethodEndpointDescriptionGET/api/feedbackGet all feedback with paginationPOST/api/feedbackCreate new feedbackPUT/api/feedback/:idUpdate existing feedbackDELETE/api/feedback/:idDelete feedback
AI & Utility Endpoints
MethodEndpointDescriptionPOST/api/askAsk AI assistant questionsGET/api/statsGet feedback statisticsGET/api/healthHealth check endpoint
Query Parameters
GET /api/feedback

page - Page number (default: 1)
limit - Items per page (default: 10)
rating - Filter by rating (1-5)
search - Search in name and message

Request Examples
Create Feedback:
bash  
   curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Great service!",
    "rating": 5
  }'
Ask AI Assistant:
bash  
   curl -X POST http://localhost:5000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I delete feedback?"
  }'
🛠️ Configuration
Environment Variables
VariableDescriptionDefaultPORTServer port5000NODE_ENVEnvironmentdevelopmentFRONTEND_URLFrontend URL for CORShttp://localhost:5173GEMINI_API_KEYGoogle Gemini API key-
Getting Gemini API Key

Visit Google AI Studio
Create a new API key
Add it to your .env file

📁 Project Structure
feedback-tracker/
├── backend/              # Backend server (Node.js/Express)
│   ├── index.js          # Main server file
│   ├── feedback.json     # Data storage (auto-generated)
│   ├── package.json      # Backend dependencies
│   ├── .env              # Environment variables (not committed)
│   ├── .env.example      # Environment template
│   └── node_modules/     # Backend dependencies
├── frontend/             # Frontend application
│   ├── src/              # Source files
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   ├── index.html        # Main HTML file
│   ├── vite.config.js    # Vite configuration (if using Vite)
│   └── node_modules/     # Frontend dependencies
├── .gitignore            # Git ignore rules
└── README.md             # This file
🔧 Development
Available Scripts
Backend:
bashcd backend

# Start production server
npm start

# Start development server with auto-restart
npm run dev

# Run tests (if implemented)
npm test
Frontend:
bashcd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (if implemented)
npm test
Root level:
bash# Install all dependencies (backend + frontend)
npm run install-all

# Start both frontend and backend concurrently
npm run dev

# Build entire project
npm run build
Adding new features

Create a new branch: git checkout -b feature/new-feature
Make your changes
Test thoroughly
Commit: git commit -m "Add new feature"
Push: git push origin feature/new-feature
Create a Pull Request

🚧 Data Storage
Feedback is stored in backend/feedback.json with the following structure:
json{
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
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
🐛 Troubleshooting
Common Issues
Server won't start:

Check if port 5000 is available
Verify Node.js version (v14+)
Check for missing dependencies: npm install

AI features not working:

Verify GEMINI_API_KEY in .env
Check API key validity
The app will use fallback responses if AI is unavailable

CORS errors:

Update FRONTEND_URL in .env
Check CORS configuration in index.js

Getting Help

📧 Open an issue on GitHub
💬 Check existing issues for solutions
📖 Review the API documentation above

🎯 Roadmap

 User authentication
 Email notifications
 Advanced analytics dashboard
 Export functionality (CSV, PDF)
 Real-time notifications
 Multiple feedback categories
 File attachment support


Made with ❤️ by ADITYA BHIMANWAR
