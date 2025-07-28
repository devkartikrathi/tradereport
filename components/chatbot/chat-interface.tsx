"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Paperclip,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  reactions?: {
    thumbsUp: number;
    thumbsDown: number;
  };
  metadata?: {
    queryType?: string;
    confidence?: number;
    suggestedActions?: string[];
  };
}

interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator = ({ isVisible }: TypingIndicatorProps) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className="rounded-lg p-3 bg-muted">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm text-muted-foreground">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const suggestedQuestions = [
  {
    icon: TrendingUp,
    question: "What's my overall trading performance this year?",
    category: "Performance",
    description: "Get a comprehensive overview of your trading results"
  },
  {
    icon: TrendingDown,
    question: "What patterns do you see in my losing trades?",
    category: "Analysis",
    description: "Identify common factors in your losing trades"
  },
  {
    icon: Target,
    question: "What's my win rate and how can I improve it?",
    category: "Metrics",
    description: "Analyze your success rate and improvement opportunities"
  },
  {
    icon: Calendar,
    question: "What's the best time of day for me to trade?",
    category: "Timing",
    description: "Discover optimal trading hours based on your data"
  },
  {
    icon: BarChart3,
    question: "Which symbols should I focus on more?",
    category: "Strategy",
    description: "Find your most profitable trading instruments"
  },
  {
    icon: AlertCircle,
    question: "What's my maximum drawdown and risk exposure?",
    category: "Risk",
    description: "Understand your risk management patterns"
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `# Welcome to TradePulse AI! 🤖

I'm your intelligent trading assistant, designed specifically for Indian markets. I can help you analyze your trading performance, identify patterns, and provide personalized insights.

## What I can help you with:

- 📊 **Performance Analysis**: Overall P&L, win rates, and profitability metrics
- 🎯 **Pattern Recognition**: Time-based patterns, symbol performance, and trading behavior
- ⚠️ **Risk Management**: Drawdown analysis, position sizing, and risk exposure
- 💡 **Strategic Insights**: Personalized recommendations for improvement
- 📈 **Market Context**: Indian market-specific analysis and insights

## Quick Start:
Try asking me questions like:
- "What's my overall trading performance?"
- "Which symbols am I most profitable with?"
- "What time of day should I trade?"
- "How can I improve my win rate?"

Ready to dive into your trading analysis? Just ask me anything!`,
      timestamp: new Date(),
      metadata: {
        queryType: "welcome",
        confidence: 1.0,
        suggestedActions: ["upload_data", "view_analytics", "set_rules"]
      }
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Add user message
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        reactions: {
          thumbsUp: 0,
          thumbsDown: 0,
        },
        metadata: {
          queryType: data.queryType || "general",
          confidence: data.confidence || 0.8,
          suggestedActions: data.suggestedActions || [],
        },
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ **Error**: I encountered an issue while processing your request.

**What happened**: ${error instanceof Error ? error.message : 'Unknown error'}

**What you can do**:
- Try asking your question again in a different way
- Check if your trading data is uploaded
- Contact support if the issue persists

I'm here to help analyze your trading performance!`,
        timestamp: new Date(),
        metadata: {
          queryType: "error",
          confidence: 0.0,
        },
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleReaction = (messageId: string, reaction: "thumbsUp" | "thumbsDown") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: {
                thumbsUp: (msg.reactions?.thumbsUp || 0) + (reaction === "thumbsUp" ? 1 : 0),
                thumbsDown: (msg.reactions?.thumbsDown || 0) + (reaction === "thumbsDown" ? 1 : 0),
              },
            }
          : msg
      )
    );
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  const handleExportChat = async (format: 'txt' | 'json' | 'csv') => {
    try {
      const exportData = {
        sessionId,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        })),
        exportDate: new Date().toISOString(),
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'txt':
          content = messages.map(msg => 
            `[${msg.timestamp.toLocaleString()}] ${msg.role.toUpperCase()}: ${msg.content}`
          ).join('\n\n');
          filename = `chat-export-${Date.now()}.txt`;
          mimeType = 'text/plain';
          break;
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          filename = `chat-export-${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          content = 'Role,Timestamp,Content\n' + 
            messages.map(msg => 
              `"${msg.role}","${msg.timestamp.toISOString()}","${msg.content.replace(/"/g, '""')}"`
            ).join('\n');
          filename = `chat-export-${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportOptions(false);
    } catch (error) {
      console.error("Failed to export chat:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Could add file preview or processing here
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getMessageIcon = (role: "user" | "assistant") => {
    return role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500";
    if (confidence >= 0.6) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            AI Trading Assistant
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <Badge variant="secondary" className="ml-auto">
              {messages.length - 1} messages
            </Badge>
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="ml-2"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
          {showExportOptions && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportChat('txt')}
              >
                Export as TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportChat('json')}
              >
                Export as JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportChat('csv')}
              >
                Export as CSV
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {getMessageIcon(message.role)}
                  </div>

                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.role === "user" ? "text-right" : ""
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      }`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Processing...</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Message metadata */}
                    <div className={`flex items-center gap-2 mt-2 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(message.timestamp)}
                      </span>
                      
                      {message.metadata?.confidence && (
                        <span className={`text-xs flex items-center gap-1 ${getConfidenceColor(message.metadata.confidence)}`}>
                          <CheckCircle className="h-3 w-3" />
                          {Math.round(message.metadata.confidence * 100)}% confidence
                        </span>
                      )}

                      {/* Message actions */}
                      {message.role === "assistant" && !message.isLoading && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMessage(message.content)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(message.id, "thumbsUp")}
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            {message.reactions?.thumbsUp && (
                              <span className="text-xs ml-1">{message.reactions.thumbsUp}</span>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(message.id, "thumbsDown")}
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsDown className="h-3 w-3" />
                            {message.reactions?.thumbsDown && (
                              <span className="text-xs ml-1">{message.reactions.thumbsDown}</span>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              <TypingIndicator isVisible={isTyping} />
            </div>
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4 space-y-4">
          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Get started with these questions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {suggestedQuestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(suggestion.question)}
                    className="h-auto p-3 text-left justify-start"
                    disabled={isLoading}
                  >
                    <suggestion.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{suggestion.category}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {suggestion.question}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {suggestion.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your trading performance..."
                disabled={isLoading}
                className="pr-20"
              />
              
              {/* File upload button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isLoading}
              >
                <Paperclip className="h-3 w-3" />
              </Button>
              
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* File preview */}
          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm flex-1">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="h-6 w-6 p-0"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
