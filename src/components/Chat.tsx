"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { ArrowUpCircle, Bot } from "lucide-react";
import FallingStars from "./FallingStars";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import { LoadingSpinner } from "./ui/LoadingSpinner";

type Message = {
  content: string;
  role: "user" | "assistant";
};

type ChatProps = {
  initialMessages: Message[];
  sessionId: string;
};

const exampleQuestions = [
  "What's Ivan's technical background?",
  "Tell me about Ivan's AI experience",
  "What are Ivan's most significant projects?",
  "What technologies does Ivan specialize in?",
  "What kind of role is Ivan looking for?",
  "Which workshops did Ivan attend?",
];

export default function Chat({ initialMessages, sessionId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm an AI assistant representing Ivan. Feel free to ask me anything about his skills, experience, and projects. How can I help you?",
        },
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageContent: string) => {
    if (messageContent.trim() === "" || isLoading) return;

    const userMessage: Message = { content: messageContent, role: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    if (messageContent === input) {
      setInput("");
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      const botMessage: Message = { content: "", role: "assistant" };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        botMessage.content += chunk;
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = { ...botMessage };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      const errorMessage: Message = {
        content: "Sorry, something went wrong.",
        role: "assistant",
      };
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === "assistant" && lastMessage.content === "") {
          newMessages[newMessages.length - 1] = errorMessage;
        } else {
          newMessages.push(errorMessage);
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const { theme } = useTheme();

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`relative flex flex-col h-screen ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <FallingStars theme={theme} />
      <main className="flex-1 w-max-w-4xl mx-auto overflow-y-auto py-16 px-4 md:px-6 space-y-4 z-10 no-scrollbar">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                }`}
              >
                <Bot
                  className={`h-5 w-5 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
            )}
            <div
              className={`max-w-lg lg:max-w-xl px-4 py-2.5 rounded-2xl shadow-sm ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : `${
                      theme === "dark"
                        ? "bg-gray-800 text-white border-gray-700"
                        : "bg-blue-50 text-blue-900 border-blue-200"
                    } border`
              }`}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5">{children}</ul>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  a: ({ children, href }) => (
                    <a href={href} className="text-blue-500 hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1].role === "user" && (
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <Bot
                className={`h-5 w-5 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </div>
            <div
              className={`max-w-lg px-4 py-2.5 rounded-2xl shadow-sm border flex items-center ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-blue-50 text-blue-900 border-blue-200"
              }`}
            >
              <LoadingSpinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="px-4 pb-4 bg-transparent z-10">
        <div className="max-w-2xl mx-auto">
          {messages.length <= 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
              {exampleQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSend(question)}
                  className={`backdrop-blur-sm border rounded-xl p-3 text-left text-sm transition-colors shadow-sm cursor-pointer ${
                    theme === "dark"
                      ? "bg-gray-900/70 border-gray-700 hover:bg-gray-800"
                      : "bg-blue-50/70 border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={`w-full pl-4 pr-12 py-3.5 rounded-full backdrop-blur-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow shadow-sm ${
                    theme === "dark"
                      ? "bg-gray-900/70 border-gray-700"
                      : "bg-blue-50/70 border-blue-200"
                  }`}
                  placeholder="Ask me anything about Ivan..."
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || input.trim() === ""}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowUpCircle className="h-8 w-8 text-blue-500 hover:text-blue-600 transition-colors" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
