import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: " Hello! I'm your AI assistant. How can I help you today? ",
      isBot: true,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setError(null);
    
    // Add user message
    const userMessage: Message = {
      text: input.trim(),
      isBot: false,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Add temporary loading message
    setIsLoading(true);
    setMessages(prev => [...prev, {
      text: "",
      isBot: true,
      timestamp: new Date().toLocaleTimeString()
    }]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: input.trim() }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      // Remove loading message and add actual response
      setMessages(prev => {
        const newMessages = prev.slice(0, -1); // Remove loading message
        return [...newMessages, {
          text: result?.ai_response || "Sorry, I couldn't process that request.",
          isBot: true,
          timestamp: new Date().toLocaleTimeString()
        }];
      });
    } catch (error) {
      console.error("Error fetching AI response:", error);
      
      // Set appropriate error message based on the error type
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMessage = "Unable to connect to the AI service. Please check if the backend server is running.";
      } else if (error instanceof DOMException && error.name === "AbortError") {
        errorMessage = "Request timed out. Please try again.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      
      // Remove loading message and add error message
      setMessages(prev => {
        const newMessages = prev.slice(0, -1); // Remove loading message
        return [...newMessages, {
          text: errorMessage,
          isBot: true,
          timestamp: new Date().toLocaleTimeString()
        }];
      });
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-500 p-4">
            <h1 className="text-2xl font-bold text-white">AI Chat Assistant</h1>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Chat Messages */}
          <div className="h-[600px] overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message.text || ""}
                isBot={message.isBot}
                timestamp={message.timestamp}
                isLoading={isLoading && index === messages.length - 1 && message.isBot}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`
                  rounded-lg px-6 py-2 transition-colors flex items-center gap-2
                  ${isLoading || !input.trim() 
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }
                `}
                disabled={isLoading || !input.trim()}
              >
                <Send className="w-4 h-4" />
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;