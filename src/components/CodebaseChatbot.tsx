import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Code, 
  FileText, 
  Search,
  Minimize2,
  Maximize2,
  X,
  Sparkles,
  Database,
  GitBranch,
  Settings,
  Copy,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectAnalysis } from '../types';
import { CodebaseChatService } from '../utils/codebaseChatService';

interface CodebaseChatbotProps {
  analysis: ProjectAnalysis;
  isVisible: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  codeSnippets?: CodeSnippet[];
  relatedFiles?: string[];
  suggestions?: string[];
}

interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
  description?: string;
}

const CodebaseChatbot: React.FC<CodebaseChatbotProps> = ({ 
  analysis, 
  isVisible, 
  onToggle 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatService] = useState(() => new CodebaseChatService(analysis));
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'bot',
        content: `👋 Hi! I'm your codebase assistant. I've analyzed **${analysis.name}** and I'm ready to help you understand your project.\n\nI can help you with:\n• 🔍 Finding specific functions or components\n• 📊 Understanding project architecture\n• 🔗 Explaining dependencies and relationships\n• 📝 Code explanations and documentation\n• 🚀 Suggesting improvements\n\nWhat would you like to know about your codebase?`,
        timestamp: new Date(),
        suggestions: [
          "What are the main components in this project?",
          "Show me the API endpoints",
          "Explain the project architecture",
          "What dependencies does this project use?",
          "Find authentication-related code"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [isVisible, analysis.name, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatService.processQuery(inputMessage);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        codeSnippets: response.codeSnippets,
        relatedFiles: response.relatedFiles,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I encountered an error while processing your question. Please try rephrasing your question or ask something else about the codebase.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <motion.div 
            className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
            }`}>
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
          </motion.div>

          {/* Message Content */}
          <motion.div 
            className={`rounded-lg p-4 ${
              isUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-slate-200 text-slate-900'
            }`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Message Text */}
            <div className="prose prose-sm max-w-none">
              {message.content.split('\n').map((line, index) => (
                <div key={index} className={`${index > 0 ? 'mt-2' : ''}`}>
                  {line.startsWith('•') ? (
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span dangerouslySetInnerHTML={{ 
                        __html: line.substring(1).trim()
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-blue-600">$1</code>')
                      }} />
                    </div>
                  ) : (
                    <span dangerouslySetInnerHTML={{ 
                      __html: line
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-blue-600">$1</code>')
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* Code Snippets */}
            {message.codeSnippets && message.codeSnippets.length > 0 && (
              <div className="mt-4 space-y-3">
                {message.codeSnippets.map((snippet, index) => (
                  <motion.div 
                    key={index} 
                    className="bg-slate-900 rounded-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between bg-slate-800 px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">
                          {snippet.filename || `${snippet.language} code`}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(snippet.code, `${message.id}-${index}`)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedMessageId === `${message.id}-${index}` ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                    <pre className="p-3 text-sm text-slate-100 overflow-x-auto">
                      <code>{snippet.code}</code>
                    </pre>
                    {snippet.description && (
                      <div className="px-3 pb-3">
                        <p className="text-xs text-slate-400">{snippet.description}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Related Files */}
            {message.relatedFiles && message.relatedFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Related Files:
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.relatedFiles.map((file, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono"
                    >
                      {file}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">💡 Try asking:</p>
                <div className="space-y-2">
                  {message.suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded text-sm text-slate-700 transition-colors"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-slate-500'}`}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className={`bg-white rounded-xl shadow-2xl border border-slate-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <motion.div 
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <MessageCircle className="w-4 h-4" />
            </motion.div>
            <div>
              <h3 className="font-semibold">Codebase Assistant</h3>
              <p className="text-xs opacity-90">Ask me anything about your code</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggle}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 h-[480px] bg-slate-50">
                {messages.map(renderMessage)}
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start mb-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <motion.div 
                              className="w-2 h-2 bg-blue-600 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div 
                              className="w-2 h-2 bg-blue-600 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                            />
                            <motion.div 
                              className="w-2 h-2 bg-blue-600 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            />
                          </div>
                          <span className="text-sm text-slate-600">Analyzing codebase...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about your codebase..."
                      className="w-full px-4 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      disabled={isLoading}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center justify-center mt-3 space-x-4 text-xs text-slate-500">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleSuggestionClick("Show me the main components")}
                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                  >
                    <GitBranch className="w-3 h-3" />
                    <span>Components</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleSuggestionClick("What are the API endpoints?")}
                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                  >
                    <Database className="w-3 h-3" />
                    <span>APIs</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleSuggestionClick("Explain the project structure")}
                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Structure</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CodebaseChatbot;