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
  onDelete: (id: string) => void | Promise<void>;
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const theme = themes.find(t => t.id === entry.themeId);

  // Find previous and next entries for sequential reading
  const sortedEntries = [...allEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const currentIndex = sortedEntries.findIndex(e => e.id === entry.id);
  const prevEntry = currentIndex < sortedEntries.length - 1 ? sortedEntries[currentIndex + 1] : null;
  const nextEntry = currentIndex > 0 ? sortedEntries[currentIndex - 1] : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setActionError(null);
    } catch { setActionError('No pudimos copiar el enlace. Puedes copiarlo desde la barra de direcciones.'); }
  };

  return (
    <div className="reader-page-container journey-reader">
      {/* Navigation and Actions */}
      <div className="editor-top-nav">
        <button type="button" onClick={onBack} className="editor-back-btn" disabled={deleting}>
          <ArrowLeft size={16} />
          <span>Volver a Bitácora</span>
        </button>

        <div className="editor-actions-group">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="btn-primary"
            disabled={deleting}
            title="Editar esta entrada"
          >
            <Edit2 size={14} />
            <span>Editar</span>
          </button>

          <details className="reader-more"><summary>Más opciones</summary><div>
          <p className="reader-private-note">Esta entrada es privada. El enlace solo funciona dentro de tu cuenta.</p>
          <button type="button" onClick={() => void handleCopyLink()} className="btn-secondary" disabled={deleting}>
            {copied ? <Check size={14} aria-hidden /> : <Share2 size={14} aria-hidden />}
            <span>{copied ? 'Enlace copiado' : 'Copiar enlace privado'}</span>
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              if (window.confirm(`¿Eliminar la entrada "${entry.title}"?`)) {
                setDeleting(true); setActionError(null);
                try { await onDelete(entry.id); onBack(); }
                catch { setActionError('No pudimos eliminar la entrada. Sigue aquí; vuelve a intentarlo.'); }
                finally { setDeleting(false); }
              }
            }}
            className="btn-secondary btn-sm"
            style={{ color: "var(--color-error)" }}
            title="Eliminar esta entrada"
          >
            <Trash2 size={14} />
            <span>{deleting ? 'Eliminando…' : 'Eliminar entrada'}</span>
          </button>
          </div></details>
        </div>
      </div>
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      {copied && <p className="entry-notice" role="status">Enlace privado copiado.</p>}

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
            {entry.summary}
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
