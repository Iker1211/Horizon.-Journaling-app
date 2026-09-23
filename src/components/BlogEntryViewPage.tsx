import React, { useState } from "react";
import { BlogEntry, BigTheme } from "../types";
import { formatDateSpanish } from "../utils/dates";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
} from "lucide-react";

interface BlogEntryViewPageProps {
  entry: BlogEntry;
  themes: BigTheme[];
  allEntries: BlogEntry[];
  onBack: () => void;
  onEdit: (entry: BlogEntry) => void;
  onDelete: (id: string) => void;
  onSelectEntry: (entryId: string) => void;
}

export const BlogEntryViewPage: React.FC<BlogEntryViewPageProps> = ({
  entry,
  themes,
  allEntries,
  onBack,
  onEdit,
  onDelete,
  onSelectEntry,
}) => {
  const [copied, setCopied] = useState(false);
  const theme = themes.find(t => t.id === entry.themeId);

  // Find previous and next entries for sequential reading
  const sortedEntries = [...allEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const currentIndex = sortedEntries.findIndex(e => e.id === entry.id);
  const prevEntry = currentIndex < sortedEntries.length - 1 ? sortedEntries[currentIndex + 1] : null;
  const nextEntry = currentIndex > 0 ? sortedEntries[currentIndex - 1] : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="reader-page-container">
      {/* Navigation and Actions */}
      <div className="editor-top-nav">
        <button type="button" onClick={onBack} className="editor-back-btn">
          <ArrowLeft size={16} />
          <span>Volver a Bitácora</span>
        </button>

        <div className="editor-actions-group">
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-secondary btn-sm"
            title="Copiar enlace directo a esta entrada"
          >
            {copied ? <Check size={14} color="var(--color-success)" /> : <Share2 size={14} />}
            <span>{copied ? "¡Enlace copiado!" : "Copiar enlace"}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="btn-secondary btn-sm"
            title="Editar esta entrada en el editor Markdown"
          >
            <Edit2 size={14} />
            <span>Editar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`¿Eliminar la entrada "${entry.title}"?`)) {
                onDelete(entry.id);
                onBack();
              }
            }}
            className="btn-secondary btn-sm"
            style={{ color: "var(--color-error)" }}
            title="Eliminar esta entrada"
          >
            <Trash2 size={14} />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* The Single Column Markdown Sheet */}
      <article className="reader-article-sheet">
        {/* Wrapper Banner */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          {theme && (
            <span
              className="blog-wrapper-badge"
              style={{
                backgroundColor: `var(--color-brand-${theme.color})`,
                color:
                  theme.color === "teal" || theme.color === "pink" || theme.color === "coral"
                    ? "#ffffff"
                    : "#0a0a0a",
                fontSize: 13,
                padding: "6px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Layers size={13} />
              <span>Wrapper: {theme.name}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="reader-hero-title">{entry.title}</h1>

        {/* Metadata Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 13,
            color: "var(--color-muted)",
            borderBottom: "1px solid var(--color-hairline)",
            paddingBottom: 20,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <span>{formatDateSpanish(entry.date)}</span>
          <span>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={13} />
            <span>{entry.readTimeMinutes || 3} min de lectura</span>
          </span>
        </div>

        {/* Summary Quote Box */}
        {entry.summary && (
          <div
            className="reader-lead-summary"
            style={{
              borderLeftColor: theme ? `var(--color-brand-${theme.color})` : undefined,
            }}
          >
            "{entry.summary}"
          </div>
        )}

        {/* Markdown Sheet Body */}
        <MarkdownRenderer content={entry.content} themeColor={theme?.color} />

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--color-hairline-soft)" }}>
            {entry.tags.map((t, idx) => (
              <span
                key={idx}
                className="blog-tag-chip"
                style={{ fontSize: 12, padding: "4px 10px" }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Sequential Journal Navigation (Previous / Next) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 32,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {prevEntry ? (
          <button
            type="button"
            onClick={() => {
              onSelectEntry(prevEntry.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <ChevronLeft size={15} />
            <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Anterior: {prevEntry.title}
            </span>
          </button>
        ) : (
          <div />
        )}

        {nextEntry && (
          <button
            type="button"
            onClick={() => {
              onSelectEntry(nextEntry.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}
          >
            <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Siguiente: {nextEntry.title}
            </span>
            <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
