from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize LangChain with DeepSeek
llm = ChatOpenAI(
    model="deepseek-chat",
    openai_api_key=os.getenv("DEEPSEEK_API_KEY"),
    openai_api_base="https://api.deepseek.com"
)

# System prompt for SupplyGuard
SYSTEM_PROMPT = """
You are the official AI assistant for SupplyGuard, a comprehensive supply chain risk management platform. 

**IMPORTANT RESTRICTIONS:**
- You can ONLY answer questions about SupplyGuard platform features, functionality, and the data within the system
- You CANNOT provide information about other companies, platforms, or general knowledge outside of SupplyGuard
- If asked about topics outside SupplyGuard, politely redirect to platform-related questions
- You CANNOT access external websites, provide investment advice, or discuss competitors
- You can ONLY reference data that exists within the SupplyGuard platform

**SupplyGuard Platform Features You Can Help With:**

1. **Dashboard**: 
   - Real-time metrics showing total suppliers, risk distribution, alerts
   - Risk trends charts and analytics
   - Executive summary cards
   - Time range filters (7d, 30d, 90d)
   - Financial impact dashboard

2. **Suppliers Management**:
   - Complete supplier database with risk scoring
   - Individual supplier profiles with detailed risk assessments
   - Supplier performance tracking and KPIs
   - Risk categorization (Critical, High, Medium, Low)
   - Supplier filtering and search capabilities
   - Page size controls (25, 50, 100 results per page)

3. **Alerts System**:
   - Real-time risk alerts for suppliers
   - Critical, high, medium, low priority classifications
   - Alert acknowledgment and resolution tracking
   - Alert categories (Financial Risk, Compliance, Cybersecurity, etc.)
   - Historical alert trends
   - Page size controls for alert viewing

4. **Reports & Analytics**:
   - Professional PDF report generation
   - Multiple report templates (Executive Summary, Risk Assessment, Compliance Audit)  
   - Custom report creation with filters
   - Export capabilities

5. **Tariff Calculator**:
   - Real-time tariff calculations for import/export
   - HS code lookup functionality
   - Multi-country trade calculations
   - Government data integration

6. **Platform Navigation**:
   - How to use different sections
   - Understanding risk scores and metrics
   - Interpreting charts and analytics
   - Managing user preferences

**Response Guidelines:**
- Only discuss SupplyGuard features and data
- If asked about external topics, respond: "I can only help with SupplyGuard platform questions. What would you like to know about our dashboard, suppliers, alerts, or other platform features?"
- Provide specific, actionable guidance about platform usage
- Reference actual data when available (current supplier counts, alert numbers, etc.)
- Keep responses concise and focused on platform functionality

**Forbidden Topics:**
- Other supply chain platforms or competitors
- General business advice unrelated to SupplyGuard
- External company information
- Investment or financial advice
- Topics outside supply chain risk management
- Personal opinions or recommendations beyond platform usage
"""

# Fallback responses
FALLBACK_RESPONSES = {
    "dashboard": "The dashboard provides a comprehensive overview of your supply chain risks, including total suppliers, active alerts, and risk distribution charts. You can use the time range filter (7d/30d/90d) to view different periods and analyze trends.",
    "supplier": "In the Suppliers section, you can view all your suppliers with their risk scores, filter by country/category/risk level, and manage page sizes (25/50/100 results). Each supplier has a detailed risk assessment with scores and performance metrics.",
    "alert": "The Alerts system shows real-time supply chain risks categorized by severity (Critical, High, Medium, Low) and type (Financial Risk, Compliance, Cybersecurity, etc.). You can filter alerts and adjust how many to view per page.",
    "report": "The Reports section allows you to generate professional PDF reports with templates like Executive Summary, Risk Assessment, and Compliance Audits. You can customize filters and export your supply chain data.",
    "tariff": "The Tariff Calculator provides real-time import/export tariff calculations using government data. Enter HS codes and select countries to get accurate duty rates and trade information.",
    "calculator": "The Tariff Calculator provides real-time import/export tariff calculations using government data. Enter HS codes and select countries to get accurate duty rates and trade information."
}

def get_fallback_response(user_message):
    """Get fallback response based on keywords"""
    message = user_message.lower()
    supply_guard_keywords = ['dashboard', 'supplier', 'alert', 'report', 'risk', 'platform', 'tariff', 'calculator', 'chart', 'metric']
    
    if not any(keyword in message for keyword in supply_guard_keywords):
        return "I can only help with SupplyGuard platform questions. What would you like to know about our dashboard, suppliers, alerts, reports, or other platform features?"
    
    for keyword, response in FALLBACK_RESPONSES.items():
        if keyword in message:
            return response
    
    return "I'm here to help with SupplyGuard platform features including Dashboard analytics, Suppliers management, Alerts monitoring, Reports generation, and the Tariff Calculator. What specific feature would you like to learn about?"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/demo')
def demo():
    return render_template('demo.html')

@app.route('/api/v1/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        messages = data.get('messages', [])
        context = data.get('context', {})
        
        if not messages:
            return jsonify({'error': 'Messages are required'}), 400
        
        # Get the last user message
        user_message = messages[-1]['content'] if messages else ""
        
        # Check if API key is configured
        if not os.getenv("DEEPSEEK_API_KEY"):
            print("⚠️ DeepSeek API key not configured - using fallback responses")
            response = get_fallback_response(user_message)
            return jsonify({
                'success': True,
                'message': response,
                'timestamp': '2024-01-01T00:00:00.000Z',
                'fallback': True
            })
        
        # Prepare messages for LangChain
        chat_messages = [SystemMessage(content=SYSTEM_PROMPT)]
        
        # Add context if available
        if context.get('currentPage'):
            context_message = f"\n\nThe user is currently on the '{context['currentPage']}' page. Provide contextually relevant help for this section."
            chat_messages.append(SystemMessage(content=context_message))
        
        # Add conversation history (last 10 messages)
        for msg in messages[-10:]:
            if msg['role'] == 'user':
                chat_messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                chat_messages.append(SystemMessage(content=msg['content']))
        
        print(f"🤖 [ChatAPI] Processing chat request with {len(messages)} messages")
        
        # Get response from LangChain
        response = llm.invoke(chat_messages)
        
        print(f"✅ [ChatAPI] Generated response: {response.content[:100]}...")
        
        return jsonify({
            'success': True,
            'message': response.content,
            'timestamp': '2024-01-01T00:00:00.000Z'
        })
        
    except Exception as error:
        print(f"❌ [ChatAPI] Error: {error}")
        
        # Fallback response
        user_message = request.json.get('messages', [{}])[-1].get('content', '') if request.json.get('messages') else ''
        response = get_fallback_response(user_message)
        
        return jsonify({
            'success': True,
            'message': response,
            'timestamp': '2024-01-01T00:00:00.000Z',
            'fallback': True
        })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    print(f"🚀 Server running on http://localhost:{port}")
    print(f"📝 Chat API available at http://localhost:{port}/api/v1/chat")
    app.run(host='0.0.0.0', port=port, debug=True) 