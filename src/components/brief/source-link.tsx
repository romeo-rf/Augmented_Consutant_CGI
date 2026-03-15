"use client";

import type { Source } from "@/lib/brief/types";
import { ExternalLink } from "lucide-react";

interface SourceLinkProps {
  source: Source;
}

export function SourceLink({ source }: SourceLinkProps) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-cgi-red hover:text-cgi-red-dark hover:underline"
      title={source.snippet || source.title}
    >
      <ExternalLink className="h-3 w-3" />
      <span className="max-w-[200px] truncate">{source.title}</span>
    </a>
  );
}
