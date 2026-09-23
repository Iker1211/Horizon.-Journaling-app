import React, { useState, useEffect, useRef, useCallback } from "react";
import { BlogEntry, BigTheme, BlogDraft } from "../types";
import { getTodayDateString } from "../utils/dates";
import { loadBlogDraft, saveBlogDraft, clearBlogDraft } from "../utils/storage";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Minus,
  Eye,
  Edit3,
  Columns,
  Check,
  Sparkles,
  Trash2,
  Layers,
  HelpCircle,
} from "lucide-react";

interface BlogEditorPageProps {
  themes: BigTheme[];
  initialThemeId?: string | null;
  entryToEdit?: BlogEntry | null;
  onSave: (entry: BlogEntry) => void;
  onBack: () => void;
}

export const BlogEditorPage: React.FC<BlogEditorPageProps> = ({
  themes,
  initialThemeId,
  entryToEdit,
  onSave,
  onBack,
}) => {
  // Determine default theme
  const getFallbackThemeId = useCallback(() => {
    if (initialThemeId && themes.some(t => t.id === initialThemeId)) return initialThemeId;
    return themes.length > 0 ? themes[0].id : "";
  }, [initialThemeId, themes]);

  const [title, setTitle] = useState("");
  const [themeId, setThemeId] = useState(getFallbackThemeId());
  const [date, setDate] = useState(getTodayDateString());
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Editor modes: "write", "split", "preview"
  const [viewMode, setViewMode] = useState<"write" | "split" | "preview">("write");
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  // Draft indicators
  const [isRestoredDraft, setIsRestoredDraft] = useState(false);
  const [lastSavedText, setLastSavedText] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Current Big Theme object
  const currentTheme = themes.find(t => t.id === themeId);

  // Sync ref for instantaneous flush on tab switch
  const stateRef = useRef({
    title,
    themeId,
    date,
    summary,
    content,
    tagsInput,
    entryToEdit,
  });

  useEffect(() => {
    stateRef.current = {
      title,
      themeId,
      date,
      summary,
      content,
      tagsInput,
      entryToEdit,
    };
  }, [title, themeId, date, summary, content, tagsInput, entryToEdit]);

  // Flush draft to localStorage synchronously
  const flushDraft = useCallback(() => {
    const s = stateRef.current;
    if (s.entryToEdit) return; // Do not overwrite drafts if editing an existing entry
    const hasContent = Boolean(s.title.trim() || s.content.trim() || s.summary.trim());
    if (hasContent) {
      const now = new Date();
      const draft: BlogDraft = {
        title: s.title,
        themeId: s.themeId,
        date: s.date,
        summary: s.summary,
        content: s.content,
        tagsInput: s.tagsInput,
        savedAt: now.toISOString(),
      };
      saveBlogDraft(draft);
      setLastSavedText(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  }, []);

  // Listen to browser tab switching (visibilitychange) and page closing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDraft();
      }
    };
    const handlePageHide = () => {
      flushDraft();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [flushDraft]);

  const hasInitializedRef = useRef(false);

  // Initialize or restore draft
  useEffect(() => {
    if (entryToEdit) {
      setTitle(entryToEdit.title);
      setThemeId(entryToEdit.themeId);
      setDate(entryToEdit.date);
      setSummary(entryToEdit.summary || "");
      setContent(entryToEdit.content || "");
      setTagsInput(entryToEdit.tags ? entryToEdit.tags.join(", ") : "");
      setIsRestoredDraft(false);
      setLastSavedText(null);
      hasInitializedRef.current = true;
    } else if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const draft = loadBlogDraft();
      const hasDraft = Boolean(draft && (draft.title?.trim() || draft.content?.trim() || draft.summary?.trim()));

      if (hasDraft && draft) {
        setTitle(draft.title || "");
        setThemeId(
          draft.themeId && themes.some(t => t.id === draft.themeId)
            ? draft.themeId
            : getFallbackThemeId()
        );
        setDate(draft.date || getTodayDateString());
        setSummary(draft.summary || "");
        setContent(draft.content || "");
        setTagsInput(draft.tagsInput || "");
        setIsRestoredDraft(true);
        if (draft.savedAt) {
          setLastSavedText(new Date(draft.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      } else {
        setTitle("");
        setThemeId(getFallbackThemeId());
        setDate(getTodayDateString());
        setSummary("");
        setContent("");
        setTagsInput("");
        setIsRestoredDraft(false);
        setLastSavedText(null);
      }
    }
  }, [entryToEdit, getFallbackThemeId, themes]);

  // Real-time debounced auto-save for new entries
  useEffect(() => {
    if (entryToEdit) return;

    const hasContent = Boolean(title.trim() || content.trim() || summary.trim());
    if (hasContent) {
      const timer = setTimeout(() => {
        const now = new Date();
        const draft: BlogDraft = {
          title,
          themeId,
          date,
          summary,
          content,
          tagsInput,
          savedAt: now.toISOString(),
        };
        saveBlogDraft(draft);
        setLastSavedText(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [title, themeId, date, summary, content, tagsInput, entryToEdit]);

  // Markdown Formatting Helper
  const insertMarkdown = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || placeholder;

    const replacement = `${prefix}${selected}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    setContent(newText);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 10);
  };

  const handleDiscardDraft = () => {
    if (window.confirm("¿Deseas descartar este borrador y comenzar una hoja en blanco?")) {
      clearBlogDraft();
      setTitle("");
      setThemeId(getFallbackThemeId());
      setDate(getTodayDateString());
      setSummary("");
      setContent("");
      setTagsInput("");
      setIsRestoredDraft(false);
      setLastSavedText(null);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Por favor escribe un título para la entrada.");
      return;
    }
    if (!themeId) {
      alert("Por favor selecciona un Wrapper para estructurar esta entrada.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const words = content.trim().split(/\s+/).length;
    const readTimeMinutes = Math.max(1, Math.round(words / 180));

    const newEntry: BlogEntry = {
      id: entryToEdit ? entryToEdit.id : `blog-${Date.now()}`,
      title: title.trim(),
      themeId,
      date,
      summary: summary.trim() || content.slice(0, 140) + "...",
      content: content.trim(),
      tags,
      readTimeMinutes,
      createdAt: entryToEdit ? entryToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newEntry);
    if (!entryToEdit) {
      clearBlogDraft();
    }
    onBack();
  };

  // Word count and read time
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.round(wordCount / 180));

  return (
    <div
      className="single-column-sheet"
      style={{
        borderTop: currentTheme ? `5px solid var(--color-brand-${currentTheme.color})` : undefined,
      }}
    >
      {/* Top Header with Back button and Actions */}
      <div className="editor-top-nav">
        <button type="button" onClick={onBack} className="editor-back-btn">
          <ArrowLeft size={16} />
          <span>Volver a Bitácora</span>
        </button>

        <div className="editor-actions-group">
          {/* Autosave Status */}
          <div className="editor-autosave-badge">
            <Check size={13} color="var(--color-success)" />
            <span>
              {lastSavedText
                ? `Guardado ${lastSavedText}`
                : "Borrador activo"}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="editor-mode-toggle">
            <button
              type="button"
              className={`editor-mode-btn ${viewMode === "write" ? "active" : ""}`}
              onClick={() => setViewMode("write")}
              title="Modo escritura"
            >
              <Edit3 size={13} />
              <span>Escribir</span>
            </button>
            <button
              type="button"
              className={`editor-mode-btn ${viewMode === "split" ? "active" : ""}`}
              onClick={() => setViewMode("split")}
              title="Pantalla dividida (Escritura + Vista Previa)"
            >
              <Columns size={13} />
              <span>Dividido</span>
            </button>
            <button
              type="button"
              className={`editor-mode-btn ${viewMode === "preview" ? "active" : ""}`}
              onClick={() => setViewMode("preview")}
              title="Vista previa completa de la hoja Markdown"
            >
              <Eye size={13} />
              <span>Vista Previa</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePublish}
            className="btn-primary btn-sm clay-button-interactive"
            style={{ padding: "8px 18px", fontWeight: 700 }}
          >
            {entryToEdit ? "Actualizar Entrada" : "Publicar Entrada"}
          </button>
        </div>
      </div>

      {/* Active Wrapper Context Pill */}
      {currentTheme && (
        <div
          style={{
            backgroundColor: `var(--color-surface-soft)`,
            border: `1.5px solid var(--color-hairline)`,
            borderLeft: `4px solid var(--color-brand-${currentTheme.color})`,
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                backgroundColor: `var(--color-brand-${currentTheme.color})`,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>
              Cuaderno de Bitácora · Wrapper: {currentTheme.name}
            </span>
          </div>
          <span className="caption-uppercase" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            Prioridad {currentTheme.priority} · {currentTheme.targetGoals2027?.length || 0} metas fijadas
          </span>
        </div>
      )}

      {/* Restored Draft Alert */}
      {isRestoredDraft && !entryToEdit && (
        <div
          style={{
            backgroundColor: "var(--color-surface-soft)",
            border: "1px solid var(--color-brand-peach)",
            borderRadius: "var(--radius-lg)",
            padding: "12px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} color="var(--color-brand-peach)" />
            <span>
              Restauramos tu borrador pendiente guardado en este equipo. Tu texto no se pierde al cambiar de pestaña.
            </span>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-error)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "underline",
            }}
          >
            <Trash2 size={13} />
            <span>Descartar</span>
          </button>
        </div>
      )}

      {/* Wrapper Selector Bar */}
      <div className="editor-theme-wrapper-bar">
        <div className="editor-theme-select-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
              Wrapper:
            </span>
            <select
              value={themeId}
              onChange={e => setThemeId(e.target.value)}
              className="select-custom"
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 700,
                border: "1.5px solid var(--color-ink)",
                backgroundColor: currentTheme ? `var(--color-surface-soft)` : undefined,
              }}
            >
              {themes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.priority.toUpperCase()})
                </option>
              ))}
            </select>

            {currentTheme && (
              <span
                className="editor-theme-badge-current"
                style={{
                  backgroundColor: `var(--color-brand-${currentTheme.color})`,
                  color:
                    currentTheme.color === "teal" ||
                    currentTheme.color === "pink" ||
                    currentTheme.color === "coral"
                      ? "#ffffff"
                      : "#0a0a0a",
                }}
              >
                <Layers size={13} />
                <span>{currentTheme.name}</span>
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--color-muted)" }}>
            <span>{wordCount} palabras</span>
            <span>·</span>
            <span>~{estimatedReadTime} min de lectura</span>
          </div>
        </div>

        {/* Metadata Chips: Date, Tags */}
        <div className="editor-meta-chips-row">
          <div className="editor-meta-item">
            <span className="caption-uppercase" style={{ fontSize: 11 }}>Fecha:</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="editor-meta-input"
            />
          </div>

          <div className="editor-meta-item" style={{ flex: 1, minWidth: 200 }}>
            <span className="caption-uppercase" style={{ fontSize: 11 }}>Etiquetas:</span>
            <input
              type="text"
              placeholder="IA, Salud, 2027..."
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="editor-meta-input"
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>

      {/* Markdown Formatting Toolbar */}
      {viewMode !== "preview" && (
        <div className="editor-markdown-toolbar">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("**", "**", "texto en negrita")}
            title="Negrita (**texto**)"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("*", "*", "texto en cursiva")}
            title="Cursiva (*texto*)"
          >
            <Italic size={15} />
          </button>

          <div className="toolbar-divider" />

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("# ", "", "Título Principal")}
            title="Encabezado 1 (# Título)"
          >
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("## ", "", "Sección")}
            title="Encabezado 2 (## Sección)"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("### ", "", "Subsección")}
            title="Encabezado 3 (### Subsección)"
          >
            <Heading3 size={16} />
          </button>

          <div className="toolbar-divider" />

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("> ", "", "Cita o reflexión clave")}
            title="Bloque de Cita (> cita)"
          >
            <Quote size={15} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("- ", "", "Elemento de lista")}
            title="Lista con viñetas (- elemento)"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("1. ", "", "Paso numerado")}
            title="Lista numerada (1. paso)"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("- [ ] ", "", "Meta o tarea por completar")}
            title="Lista de tareas (- [ ] tarea)"
          >
            <CheckSquare size={15} />
          </button>

          <div className="toolbar-divider" />

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("`", "`", "código")}
            title="Código en línea (`código`)"
          >
            <Code size={15} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("\n```\n", "\n```\n", "// Escribe código o bloque aquí")}
            title="Bloque de código (```)"
          >
            <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 800 }}>&lt;/&gt;</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertMarkdown("\n---\n", "", "")}
            title="Línea divisoria (---)"
          >
            <Minus size={15} />
          </button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
              title="Guía rápida de sintaxis Markdown"
              style={{ width: "auto", padding: "0 8px", fontSize: 12, gap: 4 }}
            >
              <HelpCircle size={14} />
              <span>Sintaxis Markdown</span>
            </button>
          </div>
        </div>
      )}

      {/* Markdown Quick Reference Popover */}
      {showMarkdownHelp && (
        <div
          style={{
            backgroundColor: "var(--color-surface-soft)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: 16,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--color-ink)" }}>
            Sintaxis Markdown Sencilla:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <div><code># Título</code> → Encabezado 1</div>
            <div><code>## Sección</code> → Encabezado 2</div>
            <div><code>**texto**</code> → <strong>Negrita</strong></div>
            <div><code>*texto*</code> → <em>Cursiva</em></div>
            <div><code>&gt; cita</code> → Bloque destacado</div>
            <div><code>- elemento</code> → Lista con viñeta</div>
            <div><code>- [ ] tarea</code> → Casilla interactiva</div>
            <div><code>---</code> → Separador horizontal</div>
          </div>
        </div>
      )}

      {/* Writing & Preview Panes */}
      {viewMode === "split" ? (
        <div className="editor-split-container">
          {/* Left: Writing Area */}
          <div className="editor-canvas-card">
            <input
              type="text"
              placeholder="Título de la reflexión..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="editor-title-input"
            />
            <input
              type="text"
              placeholder="Resumen o extracto breve..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="editor-summary-input"
            />
            <textarea
              ref={textareaRef}
              placeholder="Escribe tu reflexión en Markdown..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="editor-markdown-textarea"
            />
          </div>

          {/* Right: Live Preview */}
          <div className="editor-split-preview-pane">
            <div style={{ marginBottom: 12 }}>
              <span className="caption-uppercase" style={{ color: "var(--color-muted)", fontSize: 11 }}>
                Vista Previa en Vivo
              </span>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, margin: "8px 0" }}>
                {title || "Título sin definir"}
              </h1>
              {summary && (
                <p style={{ fontStyle: "italic", color: "var(--color-muted)", margin: "8px 0 16px" }}>
                  {summary}
                </p>
              )}
            </div>
            <MarkdownRenderer content={content} themeColor={currentTheme?.color} />
          </div>
        </div>
      ) : viewMode === "preview" ? (
        /* Full Page Preview */
        <div className="reader-article-sheet">
          {currentTheme && (
            <span
              className="blog-wrapper-badge"
              style={{
                backgroundColor: `var(--color-brand-${currentTheme.color})`,
                color:
                  currentTheme.color === "teal" ||
                  currentTheme.color === "pink" ||
                  currentTheme.color === "coral"
                    ? "#ffffff"
                    : "#0a0a0a",
              }}
            >
              {currentTheme.name}
            </span>
          )}
          <h1 className="reader-hero-title">{title || "Sin Título"}</h1>
          {summary && <div className="reader-lead-summary">{summary}</div>}
          <MarkdownRenderer content={content} themeColor={currentTheme?.color} />
        </div>
      ) : (
        /* Normal Single-Column Writing Canvas */
        <div className="editor-canvas-card">
          <input
            type="text"
            placeholder="Título de la reflexión..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="editor-title-input"
          />
          <input
            type="text"
            placeholder="Resumen o extracto breve (opcional)..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
            className="editor-summary-input"
          />
          <textarea
            ref={textareaRef}
            placeholder="Escribe libremente tus aprendizajes, modelos mentales o dificultades del día en Markdown...&#10;&#10;Usa # para títulos, - para listas, > para citas o **negrita** para resaltar."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="editor-markdown-textarea"
          />
        </div>
      )}
    </div>
  );
};
