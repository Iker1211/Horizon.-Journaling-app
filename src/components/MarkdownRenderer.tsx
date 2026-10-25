import React, { useLayoutEffect, useMemo, useRef } from "react";
import { marked } from "marked";
import DOMPurify from 'dompurify';

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

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  className = "",
  themeColor,
}: MarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => {
    if (!content || !content.trim()) {
      return "<p class=\"markdown-empty-placeholder\" style=\"color: var(--color-muted); font-style: italic;\">No hay contenido escrito aún...</p>";
    }
    try {
      return DOMPurify.sanitize(marked.parse(content) as string, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'iframe'], FORBID_ATTR: ['style'] });
    } catch {
      return DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }
  }, [content]);

  useLayoutEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    // Wide code and tables must be reachable without a pointer. Keep ordinary
    // prose and blocks that fit out of the keyboard's tab sequence.
    const regions = [...root.querySelectorAll<HTMLElement>('pre, table')];
    if (!regions.length) return;
    const update = () => {
      for (const region of regions) {
        if (region.scrollWidth > region.clientWidth + 1) region.tabIndex = 0;
        else region.removeAttribute('tabindex');
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    regions.forEach(region => observer.observe(region));
    update();
    return () => observer.disconnect();
  });

  const style: React.CSSProperties = themeColor
    ? ({
        "--sheet-theme-color": `var(--color-brand-${themeColor})`,
      } as React.CSSProperties)
    : {};

  return (
    <div
      ref={contentRef}
      className={`markdown-sheet-content ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
