"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

const suggestedQuestions = [
  {
    icon: TrendingUp,
    question: "What's my overall trading performance this year?",
    category: "Performance",
  },
  {
    icon: TrendingDown,
    question: "What patterns do you see in my losing trades?",
    category: "Analysis",
  },
  {
    icon: Target,
    question: "What's my win rate and how can I improve it?",
    category: "Metrics",
  },
  {
    icon: Calendar,
    question: "What's the best time of day for me to trade?",
    category: "Timing",
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI trading assistant. I can help you analyze your trading performance, identify patterns, and provide personalized insights. What would you like to know about your trades?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Add user message and loading message
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? { ...msg, content: data.response, isLoading: false }
            : msg
        )
      );
    } catch {
      // Replace loading message with error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? {
                ...msg,
                content:
                  "Sorry, I encountered an error while processing your request. Please try again.",
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
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

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            AI Trading Assistant
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardTitle>
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
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
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
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your trading performance..."
              disabled={isLoading}
              className="flex-1"
            />
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
        </div>
      </Card>
    </div>
  );
}
