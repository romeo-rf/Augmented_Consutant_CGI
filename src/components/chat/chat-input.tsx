"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

interface ChatInputProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [input, setInput] = useState("");

  function handleSend() {
    const text = input.trim();
    if (!text || disabled) return;
    onSend(text);
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t border-cgi-gray-200">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Décrivez votre prochain rendez-vous..."
        className="min-h-[44px] max-h-[120px] resize-none"
        rows={1}
        disabled={disabled}
      />
      <Button
        type="button"
        size="icon"
        disabled={!input.trim() || disabled}
        onClick={handleSend}
        className="shrink-0 bg-cgi-red hover:bg-cgi-red-dark"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
