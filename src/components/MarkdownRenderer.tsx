import React, { useMemo } from "react";
import { marked } from "marked";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  themeColor?: string;
}

// Configure marked with GitHub Flavored Markdown and line breaks
marked.use({
  gfm: true,
  breaks: true,
});

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
  themeColor,
}) => {
  const html = useMemo(() => {
    if (!content || !content.trim()) {
      return "<p class=\"markdown-empty-placeholder\" style=\"color: var(--color-muted); font-style: italic;\">No hay contenido escrito aún...</p>";
    }
    try {
      return marked.parse(content) as string;
    } catch (e) {
      console.error("Markdown parse error:", e);
      return "<p>" + content + "</p>";
    }
  }, [content]);

  const style: React.CSSProperties = themeColor
    ? ({
        "--sheet-theme-color": `var(--color-brand-${themeColor})`,
      } as React.CSSProperties)
    : {};

  return (
    <div
      className={`markdown-sheet-content ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
