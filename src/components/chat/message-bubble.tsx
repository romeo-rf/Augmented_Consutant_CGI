"use client";

import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";

interface MessageBubbleProps {
  message: UIMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Extraire le texte depuis les parts (API v6)
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  if (!text) return null;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-cgi-red text-white"
            : "bg-white text-cgi-gray-800 shadow-sm border border-cgi-gray-200"
        )}
      >
        <div className="whitespace-pre-wrap">{text}</div>
      </div>
    </div>
  );
}
