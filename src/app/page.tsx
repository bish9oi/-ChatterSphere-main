"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  useCallback,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Upload, Sun, Moon, Pencil, Check, X } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  isFile?: boolean;
  fileName?: string;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function ChatBotUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_KEY = "AIzaSyCMop0dAWFMLeau24cM4S2spDe23Z97zPQ";
  const MODEL = "gemini-2.0-flash-lite";
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  useEffect(() => {
    const loadPdfJs = async () => {
      if (!window.pdfjsLib) {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        };
        document.body.appendChild(script);
      }
    };
    loadPdfJs();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      const prefersDark = storedTheme === "dark";
      setIsDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendToBot = async (textToSend: string) => {
    const userMessage: Message = {
      id: Date.now(),
      text: textToSend,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      let fullPrompt = textToSend;
      if (pdfContent) {
        fullPrompt = `Answer this based on the PDF content:\n\n${pdfContent}\n\nQuestion: ${textToSend}`;
      }

      history.push({
        role: "user",
        parts: [{ text: fullPrompt }],
      });

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: history,
          generationConfig: { responseMimeType: "text/plain" },
        }),
      });

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "❌ AI failed to respond.";

      const botMessage: Message = {
        id: Date.now() + 1,
        text,
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "❌ Error contacting AI.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (editId !== null) {
      const updatedMessages = messages.map((msg) =>
        msg.id === editId ? { ...msg, text: input } : msg
      );
      setMessages(updatedMessages);
      setEditId(null);
      setEditValue("");
      setInput("");
      await sendToBot(input);
      return;
    }

    await sendToBot(input);
    setInput("");
  };

  const parsePdfFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      text += `Page ${i}: ${pageText}\n\n`;
    }

    console.log("📄 Parsed PDF content:\n", text);
    setPdfContent(text);
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".pdf")) {
      alert("Only PDF files are supported!");
      return;
    }

    const userFileMessage: Message = {
      id: Date.now(),
      text: `📎 Uploaded PDF: ${file.name}`,
      sender: "user",
      isFile: true,
      fileName: file.name,
    };

    setMessages((prev) => [...prev, userFileMessage]);

    try {
      await parsePdfFile(file);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: `🤖 PDF '${file.name}' processed. You can now ask questions related to it.`,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "❌ Failed to parse the PDF.",
          sender: "bot",
        },
      ]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-muted text-muted-foreground transition-colors duration-300">
      <header className="bg-background shadow p-4 text-left text-xl font-bold flex justify-between items-center">
        <span>🤖 ChatterSphere</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </header>

      <main className="flex flex-col flex-1 p-4">
        <Card className="flex flex-col flex-1">
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="relative">
                      {editId === msg.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full"
                          />
                          <Button size="icon" onClick={handleSend}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditId(null);
                              setInput("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={`group max-w-xl p-3 rounded-xl text-sm whitespace-pre-wrap ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {msg.text}
                          {msg.sender === "user" && (
                            <button
                              onClick={() => {
                                setEditId(msg.id);
                                setInput(msg.text);
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs text-muted-foreground"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-sm p-3 rounded-xl text-sm bg-secondary text-secondary-foreground animate-pulse">
                      🤖 Typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />

          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            size="icon"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Upload PDF"
          >
            <Upload className="w-5 h-5" />
          </Button>

          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
            className="-mb-1"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </main>
    </div>
  );
}