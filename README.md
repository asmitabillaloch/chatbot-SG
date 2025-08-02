SUPPLYGUARD CHATBOT 
===================

WHAT WE BUILT:
---------------
A AI chatbot for SupplyGuard, a supply chain risk management platform. 
The chatbot can answer questions about the platform's features, dashboard, suppliers, 
alerts, reports, and tariff calculations.

TECHNOLOGIES USED:
------------------

BACKEND:
- Python 3.12
- Flask (Web framework)
- LangChain (AI/LLM framework)
- LangChain-OpenAI (DeepSeek API integration)
- Flask-CORS (Cross-origin support)
- python-dotenv (Environment variables)

FRONTEND:
- HTML5
- CSS3
- JavaScript (ES6+)
- No frameworks - vanilla JS

AI/LLM:
- DeepSeek API (AI model)
- LangChain for structured AI interactions

WORKFLOW:
----------

1. USER INTERFACE:
   - User types message in HTML form
   - JavaScript captures the input
   - Message is sent to Flask backend via fetch API

2. BACKEND PROCESSING:
   - Flask receives POST request at /api/v1/chat
   - LangChain processes the message with context
   - System prompt restricts AI to SupplyGuard topics only
   - DeepSeek API generates response

3. AI INTEGRATION:
   - LangChain ChatOpenAI connects to DeepSeek
   - SystemMessage sets AI personality and restrictions
   - HumanMessage contains user input
   - Message history maintains conversation context

4. RESPONSE HANDLING:
   - AI response is sent back to frontend
   - JavaScript displays response in chat interface
   - Messages are stored in browser localStorage

KEY FEATURES:
-------------
- UI with typing indicators
- Message persistence (saves chat history)
- Fallback responses for common queries
- Restricted AI responses (only SupplyGuard topics)
- Real-time chat interface

FILES STRUCTURE:
----------------
chatbot-standalone-python/
├── app.py                 # Flask server with LangChain
├── requirements.txt       # Python dependencies
├── .env                  # API key (DEEPSEEK_API_KEY)
├── templates/
│   └── index.html        # Chatbot interface
└── static/
    ├── css/styles.css    # Styling
    └── js/chatbot.js     # Frontend logic

HOW TO RUN:
-----------
1. Install Python dependencies: pip install -r requirements.txt
2. Set up .env file with DeepSeek API key
3. Run: python app.py
4. Open browser to: http://localhost:3001

LANGCHAIN INTEGRATION:
---------------------
- Uses LangChain's structured approach for AI interactions
- SystemMessage defines AI personality and restrictions
- HumanMessage handles user inputs
- ChatOpenAI connects to DeepSeek API
- Maintains conversation context through message history

This creates a professional, standalone chatbot that can be easily deployed 
and shared as a complete assignment submission. 
