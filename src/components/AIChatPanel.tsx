import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  codeSnippet?: string;
}

interface AIChatPanelProps {
  onSchemaChange?: (schema: string) => void;
}

const AIChatPanel = ({ onSchemaChange = () => {} }: AIChatPanelProps) => {
  const [customMessages, setCustomMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Welcome to Prisma Drop! How can I help you with your database schema today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // For demo purposes, we'll use a mock chat implementation
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateMockAIResponse(input);
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);

      // Extract schema from AI response if present
      const schemaMatch = aiResponse.content.match(/```prisma\n([\s\S]*?)```/);
      if (schemaMatch) {
        onSchemaChange(schemaMatch[1]);
      }
    }, 1000);
  };

  const generateMockAIResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase();
    let response = "I can help you with Prisma schema changes. ";

    if (lowerInput.includes("create") && lowerInput.includes("user")) {
      response = `I'll create a User model for you:\n\n\`\`\`prisma\nmodel User {\n  id        Int      @id @default(autoincrement())\n  email     String   @unique\n  name      String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\`\`\``;
    } else if (lowerInput.includes("add") && lowerInput.includes("post")) {
      response = `I'll add a Post model with a relation to User:\n\n\`\`\`prisma\nmodel Post {\n  id        Int      @id @default(autoincrement())\n  title     String\n  content   String?\n  published Boolean  @default(false)\n  author    User     @relation(fields: [authorId], references: [id])\n  authorId  Int\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\nmodel User {\n  id        Int      @id @default(autoincrement())\n  email     String   @unique\n  name      String?\n  posts     Post[]\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\`\`\``;
    } else if (lowerInput.includes("comment")) {
      response = `I'll add a Comment model:\n\n\`\`\`prisma\nmodel Comment {\n  id        Int      @id @default(autoincrement())\n  content   String\n  post      Post     @relation(fields: [postId], references: [id])\n  postId    Int\n  author    User     @relation(fields: [authorId], references: [id])\n  authorId  Int\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\nmodel Post {\n  id        Int      @id @default(autoincrement())\n  title     String\n  content   String?\n  published Boolean  @default(false)\n  author    User     @relation(fields: [authorId], references: [id])\n  authorId  Int\n  comments  Comment[]\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\nmodel User {\n  id        Int      @id @default(autoincrement())\n  email     String   @unique\n  name      String?\n  posts     Post[]\n  comments  Comment[]\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\`\`\``;
    }

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: response,
    };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, customMessages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Convert Vercel AI messages to our custom format for display
  const displayMessages = [
    ...customMessages,
    ...messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      sender: msg.role === "user" ? ("user" as const) : ("ai" as const),
      timestamp: new Date(),
      codeSnippet:
        msg.role === "assistant" ? extractCodeSnippet(msg.content) : undefined,
    })),
  ];

  function extractCodeSnippet(content: string): string | undefined {
    const schemaMatch = content.match(/```prisma\n([\s\S]*?)\n```/);
    return schemaMatch ? schemaMatch[1] : undefined;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">AI Schema Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Ask me to create or modify your database schema
        </p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {displayMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-3 max-w-[85%] ${message.sender === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              <div className="flex items-start gap-3">
                {message.sender === "ai" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=prisma" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className="space-y-2">
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  {message.codeSnippet && (
                    <div className="bg-black text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                      <pre>{message.codeSnippet}</pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {isLoading && (
            <Card className="p-3 max-w-[85%] bg-muted">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=prisma" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="text-sm">Thinking...</div>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about schema changes, e.g. 'Create a User model'"
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIChatPanel;
