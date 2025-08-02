class SupplyGuardChatbot {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatForm = document.getElementById('chatForm');
        
        this.initializeEventListeners();
        this.loadMessages();
    }

    initializeEventListeners() {
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });

        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
    }

    loadMessages() {
        const savedMessages = localStorage.getItem('supplyGuardChatMessages');
        if (savedMessages) {
            try {
                this.messages = JSON.parse(savedMessages);
                this.renderMessages();
            } catch (error) {
                console.error('Failed to load saved messages:', error);
                this.initializeWelcomeMessage();
            }
        } else {
            this.initializeWelcomeMessage();
        }
    }

    saveMessages() {
        localStorage.setItem('supplyGuardChatMessages', JSON.stringify(this.messages));
    }

    initializeWelcomeMessage() {
        const welcomeMessage = {
            id: 'welcome-' + Date.now(),
            text: `Welcome to SupplyGuard AI. I'm your dedicated platform assistant, here to help you navigate SupplyGuard's features and analyze your supply chain data.

**I can only help with SupplyGuard platform questions:**
• **Dashboard** - metrics, charts, time filters
• **Suppliers** - risk scores, filtering, management
• **Alerts** - monitoring, categories, prioritization
• **Reports** - generation, templates, exports
• **Tariff Calculator** - import/export calculations

**Try asking me:**
- "How do I filter suppliers by risk level?"
- "What do the dashboard time filters do?"
- "How do I generate a risk assessment report?"
- "How many critical suppliers do I have?"

I cannot answer questions about other platforms or general business topics. What would you like to know about SupplyGuard?`,
            isUser: false,
            timestamp: new Date()
        };
        this.messages = [welcomeMessage];
        this.renderMessages();
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        const userMessage = {
            id: Date.now().toString(),
            text: message,
            isUser: true,
            timestamp: new Date()
        };

        this.messages.push(userMessage);
        this.renderMessages();
        this.messageInput.value = '';
        this.updateSendButton();

        this.isTyping = true;
        this.showTypingIndicator();

        try {
            const response = await this.sendChatMessage(message);
            
            const botMessage = {
                id: (Date.now() + 1).toString(),
                text: response,
                isUser: false,
                timestamp: new Date()
            };

            this.messages.push(botMessage);
            this.renderMessages();
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                isUser: false,
                timestamp: new Date()
            };

            this.messages.push(errorMessage);
            this.renderMessages();
        } finally {
            this.isTyping = false;
            this.hideTypingIndicator();
        }
    }

    async sendChatMessage(userMessage) {
        try {
            const response = await fetch('/api/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        ...this.messages.map(msg => ({
                            role: msg.isUser ? 'user' : 'assistant',
                            content: msg.text
                        })),
                        { role: 'user', content: userMessage }
                    ],
                    context: {
                        currentPage: this.getCurrentPage(),
                        userId: 'current-user',
                        totalSuppliers: 0,
                        criticalSuppliers: 0,
                        activeAlerts: 0,
                        recentActivity: [],
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.message || 'I apologize, but I encountered an error. Please try again.';

        } catch (error) {
            console.error('Chat API error:', error);
            
            // Fallback response system
            const message = userMessage.toLowerCase();
            
            // Check if the question is about SupplyGuard platform
            const supplyGuardKeywords = ['dashboard', 'supplier', 'alert', 'report', 'risk', 'platform', 'tariff', 'calculator', 'chart', 'metric'];
            const isSupplyGuardRelated = supplyGuardKeywords.some(keyword => message.includes(keyword));
            
            if (!isSupplyGuardRelated) {
                return "I can only help with SupplyGuard platform questions. What would you like to know about our dashboard, suppliers, alerts, reports, or other platform features?";
            } else if (message.includes('dashboard')) {
                return "The dashboard provides a comprehensive overview of your supply chain risks, including total suppliers, active alerts, and risk distribution charts. You can use the time range filter (7d/30d/90d) to view different periods and analyze trends.";
            } else if (message.includes('supplier')) {
                return "In the Suppliers section, you can view all your suppliers with their risk scores, filter by country/category/risk level, and manage page sizes (25/50/100 results). Each supplier has a detailed risk assessment with scores and performance metrics.";
            } else if (message.includes('alert')) {
                return "The Alerts system shows real-time supply chain risks categorized by severity (Critical, High, Medium, Low) and type (Financial Risk, Compliance, Cybersecurity, etc.). You can filter alerts and adjust how many to view per page.";
            } else if (message.includes('report')) {
                return "The Reports section allows you to generate professional PDF reports with templates like Executive Summary, Risk Assessment, and Compliance Audits. You can customize filters and export your supply chain data.";
            } else if (message.includes('tariff') || message.includes('calculator')) {
                return "The Tariff Calculator provides real-time import/export tariff calculations using government data. Enter HS codes and select countries to get accurate duty rates and trade information.";
            } else {
                return "I'm here to help with SupplyGuard platform features including Dashboard analytics, Suppliers management, Alerts monitoring, Reports generation, and the Tariff Calculator. What specific feature would you like to learn about?";
            }
        }
    }

    getCurrentPage() {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            return path.split('/').pop() || 'dashboard';
        }
        return 'dashboard';
    }

    renderMessages() {
        this.messagesContainer.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            this.messagesContainer.appendChild(messageElement);
        });
        
        this.scrollToBottom();
        this.saveMessages();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.isUser ? 'user' : 'bot'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (message.isUser) {
            contentDiv.textContent = message.text;
        } else {
            // Parse markdown-like formatting for bot messages
            contentDiv.innerHTML = this.formatMessage(message.text);
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(message.timestamp);
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        return messageDiv;
    }

    formatMessage(text) {
        // Simple markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/•\s*(.*?)(?=\n|$)/g, '<li>$1</li>')
            .replace(/\n/g, '<br>')
            .replace(/<li>/g, '<ul><li>')
            .replace(/<\/li>(?=<br>|$)/g, '</li></ul>');
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typing-indicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            contentDiv.appendChild(dot);
        }
        
        typingDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    updateSendButton() {
        this.sendButton.disabled = !this.messageInput.value.trim() || this.isTyping;
    }

    clearChat() {
        this.messages = [];
        localStorage.removeItem('supplyGuardChatMessages');
        this.initializeWelcomeMessage();
    }

    sendExampleQuery(query) {
        this.messageInput.value = query;
        this.handleSendMessage();
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new SupplyGuardChatbot();
});

// Global functions
function clearChat() {
    if (window.chatbot) {
        window.chatbot.clearChat();
    }
}

function sendExampleQuery(query) {
    if (window.chatbot) {
        window.chatbot.sendExampleQuery(query);
    }
} 
