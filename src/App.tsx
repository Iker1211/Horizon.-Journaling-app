import React, { useState, useEffect } from "react";
import { ActiveTab, BigTheme, BlogEntry } from "./types";
import { getCountdownTo2027, CountdownTime } from "./utils/dates";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import {
  getThemes,
  saveThemeItem,
  deleteThemeItem,
  getBlogEntries,
  saveBlogEntryItem,
  deleteBlogEntryItem,
  syncLocalToSupabase,
} from "./services/db";
import { resetAllData } from "./utils/storage";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { CalendarCountdown } from "./components/CalendarCountdown";
import { BigThemesManager } from "./components/BigThemesManager";
import { BlogJournal } from "./components/BlogJournal";
import { BlogEditorPage } from "./components/BlogEditorPage";
import { BlogEntryViewPage } from "./components/BlogEntryViewPage";
import { ThemeModal } from "./components/ThemeModal";
import { AuthModal, AuthMode } from "./components/AuthModal";
import { FireGoatLogo } from "./components/FireGoatLogo";
import { BottomNav } from "./components/BottomNav";
import { QuickActionSheet } from "./components/QuickActionSheet";
import { DesignSystemVisualizer } from "./components/DesignSystemVisualizer";
import { WrapperStudioPage } from "./components/WrapperStudioPage";
import { WrapperProvider } from "./context/WrapperContext";
import { useAndroidBackHandler } from "./hooks/useAndroidBackHandler";

export const App: React.FC = () => {
  // Navigation & Route state
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [editorEntryId, setEditorEntryId] = useState<string | null>(null);
  const [editorThemeId, setEditorThemeId] = useState<string | null>(null);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [activeWrapperStudioId, setActiveWrapperStudioId] = useState<string | null>(null);

  // Supabase Auth State
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>("signin");

  // Domain Data State
  const [themes, setThemes] = useState<BigTheme[]>([]);
  const [blogEntries, setBlogEntries] = useState<BlogEntry[]>([]);

  // Filter State
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string | null>(null);

  // Modals State (Themes, Auth, QuickAction)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<BigTheme | null>(null);

  const [isQuickActionSheetOpen, setIsQuickActionSheetOpen] = useState(false);

  // Android hardware back button handler
  useAndroidBackHandler({
    hasOpenModal: isThemeModalOpen || isAuthModalOpen || isQuickActionSheetOpen,
    closeModals: () => {
      setIsThemeModalOpen(false);
      setIsAuthModalOpen(false);
      setIsQuickActionSheetOpen(false);
    },
    activeTab,
    setActiveTab,
  });

  // Real-time Countdown Timer
  const [countdown, setCountdown] = useState<CountdownTime>(() => getCountdownTo2027());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTo2027());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync route with URL hash for browser history, reload and back button
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (!hash || hash === "dashboard") {
        setActiveTab("dashboard");
      } else if (hash === "calendar") {
        setActiveTab("calendar");
      } else if (hash === "themes") {
        setActiveTab("themes");
      } else if (hash === "blog") {
        setActiveTab("blog");
      } else if (hash === "design" || hash === "ds") {
        setActiveTab("design");
      } else if (hash.startsWith("write") || hash.startsWith("editor")) {
        setActiveTab("editor");
        const searchPart = hash.includes("?") ? hash.split("?")[1] : "";
        const params = new URLSearchParams(searchPart);
        setEditorEntryId(params.get("edit") || null);
        setEditorThemeId(params.get("theme") || null);
      } else if (hash.startsWith("entry/")) {
        const id = hash.replace("entry/", "");
        if (id) {
          setViewingEntryId(id);
          setActiveTab("entry");
        }
      } else if (hash.startsWith("w/") || hash.startsWith("wrapper/")) {
        const id = hash.replace(/^(w\/|wrapper\/)/, "");
        if (id) {
          setActiveWrapperStudioId(id);
          setActiveTab("wrapper-studio");
        }
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Initial Data Load & Supabase Auth Listener
  useEffect(() => {
    const loadInitialData = async (userId?: string) => {
      const [loadedThemes, loadedBlogs] = await Promise.all([
        getThemes(userId),
        getBlogEntries(userId),
      ]);
      setThemes(loadedThemes);
      setBlogEntries(loadedBlogs);
    };

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        loadInitialData(currentUser?.id);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (event === "PASSWORD_RECOVERY") {
          setAuthInitialMode("update-password");
          setIsAuthModalOpen(true);
        }
        if (currentUser) {
          await syncLocalToSupabase(currentUser.id);
        }
        loadInitialData(currentUser?.id);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      loadInitialData();
    }
  }, []);

  // --- Route Handlers ---
  const navigateToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === "dashboard" || tab === "calendar" || tab === "themes" || tab === "blog" || tab === "design") {
      window.location.hash = `#/${tab}`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleOpenWrapperStudio = (wrapperId: string) => {
    setActiveWrapperStudioId(wrapperId);
    setActiveTab("wrapper-studio");
    window.location.hash = `#/w/${wrapperId}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenEditor = (entryId?: string, themeId?: string) => {
    setEditorEntryId(entryId || null);
    setEditorThemeId(themeId || selectedThemeFilter || null);
    setActiveTab("editor");
    if (entryId) {
      window.location.hash = `#/write?edit=${entryId}`;
    } else if (themeId) {
      window.location.hash = `#/write?theme=${themeId}`;
    } else {
      window.location.hash = "#/write";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenEntry = (entryId: string) => {
    setViewingEntryId(entryId);
    setActiveTab("entry");
    window.location.hash = `#/entry/${entryId}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToBlog = () => {
    setActiveTab("blog");
    setViewingEntryId(null);
    setEditorEntryId(null);
    window.location.hash = "#/blog";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- CRUD: Themes ---
  const handleSaveTheme = async (theme: BigTheme) => {
    await saveThemeItem(theme, user?.id);
    const updated = await getThemes(user?.id);
    setThemes(updated);
  };

  const handleDeleteTheme = async (id: string) => {
    await deleteThemeItem(id, user?.id);
    const updated = await getThemes(user?.id);
    setThemes(updated);
    if (selectedThemeFilter === id) {
      setSelectedThemeFilter(null);
    }
  };

  // --- CRUD: Blog Entries ---
  const handleSaveBlogEntry = async (entry: BlogEntry) => {
    await saveBlogEntryItem(entry, user?.id);
    const updated = await getBlogEntries(user?.id);
    setBlogEntries(updated);
  };

  const handleDeleteBlogEntry = async (id: string) => {
    await deleteBlogEntryItem(id, user?.id);
    const updated = await getBlogEntries(user?.id);
    setBlogEntries(updated);
    if (viewingEntryId === id) {
      handleBackToBlog();
    }
  };

  // Demo data reset handler
  const handleResetData = async () => {
    const reset = resetAllData();
    setThemes(reset.themes);
    setBlogEntries(reset.blogEntries);
    if (user?.id) {
      await syncLocalToSupabase(user.id);
      const loadedThemes = await getThemes(user.id);
      const loadedBlogs = await getBlogEntries(user.id);
      setThemes(loadedThemes);
      setBlogEntries(loadedBlogs);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      const loadedThemes = await getThemes();
      const loadedBlogs = await getBlogEntries();
      setThemes(loadedThemes);
      setBlogEntries(loadedBlogs);
    }
  };

  // Find currently viewed entry
  const activeViewingEntry = viewingEntryId
    ? blogEntries.find(b => b.id === viewingEntryId) || null
    : null;

  // Find currently edited entry
  const activeEditingEntry = editorEntryId
    ? blogEntries.find(b => b.id === editorEntryId) || null
    : null;

  // Find currently active wrapper for Studio
  const activeStudioWrapper = activeWrapperStudioId
    ? themes.find(t => t.id === activeWrapperStudioId) || (themes.length > 0 ? themes[0] : null)
    : (themes.length > 0 ? themes[0] : null);

  return (
    <WrapperProvider
      wrappers={themes}
      activeWrapperId={activeTab === 'wrapper-studio' ? (activeStudioWrapper?.id || null) : selectedThemeFilter}
      setActiveWrapperId={id => {
        if (id) {
          handleOpenWrapperStudio(id);
        } else {
          setSelectedThemeFilter(null);
        }
      }}
      blogEntries={blogEntries}
    >
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          onOpenQuickEntry={() => handleOpenEditor()}
          onResetData={handleResetData}
          userEmail={user?.email || null}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
        />

        <main className="app-main-layout" style={{ flex: 1 }}>
          {activeTab === "dashboard" && (
            <Dashboard
              themes={themes}
              blogEntries={blogEntries}
              countdown={countdown}
              setActiveTab={navigateToTab}
              onSelectBlogEntry={entry => handleOpenEntry(entry.id)}
              onSelectThemeFilter={themeId => {
                setSelectedThemeFilter(themeId);
                navigateToTab("blog");
              }}
              onOpenWrapperStudio={handleOpenWrapperStudio}
              onWriteForTheme={themeId => handleOpenEditor(undefined, themeId)}
              onOpenQuickEntry={() => handleOpenEditor()}
            />
          )}

        {activeTab !== "dashboard" && (
          <div className="main-content" style={{ marginTop: 24 }}>
            {activeTab === "calendar" && (
          <CalendarCountdown
            countdown={countdown}
            themes={themes}
            blogEntries={blogEntries}
            onSelectDate={_dateStr => {}}
            onWriteEntryForDate={_dateStr => {
              handleOpenEditor();
            }}
            onSelectBlogEntry={entry => handleOpenEntry(entry.id)}
          />
        )}

        {activeTab === "themes" && (
          <BigThemesManager
            themes={themes}
            blogEntries={blogEntries}
            onOpenCreateTheme={() => {
              setThemeToEdit(null);
              setIsThemeModalOpen(true);
            }}
            onEditTheme={theme => {
              setThemeToEdit(theme);
              setIsThemeModalOpen(true);
            }}
            onDeleteTheme={handleDeleteTheme}
            onWriteForTheme={themeId => handleOpenEditor(undefined, themeId)}
            onFilterBlogByTheme={themeId => {
              setSelectedThemeFilter(themeId);
              navigateToTab("blog");
            }}
            onOpenStudio={handleOpenWrapperStudio}
          />
        )}

        {/* Dedicated Full-Route Immersive Wrapper Studio (The Enveloping Dimension) */}
        {activeTab === "wrapper-studio" && (
          activeStudioWrapper ? (
            <WrapperStudioPage
              wrapper={activeStudioWrapper}
              allWrappers={themes}
              blogEntries={blogEntries}
              onSelectWrapper={handleOpenWrapperStudio}
              onWriteForWrapper={themeId => handleOpenEditor(undefined, themeId)}
              onOpenReader={entry => handleOpenEntry(entry.id)}
              onEditWrapper={theme => {
                setThemeToEdit(theme);
                setIsThemeModalOpen(true);
              }}
              onBackToAllWrappers={() => navigateToTab("themes")}
            />
          ) : (
            <div className="single-column-sheet" style={{ textAlign: "center", padding: "80px 20px" }}>
              <h2 className="title-lg" style={{ fontFamily: "var(--font-display)" }}>Wrapper no encontrado</h2>
              <p className="body-md" style={{ color: "var(--color-muted)", margin: "12px 0 24px" }}>
                El Wrapper solicitado no existe o fue eliminado.
              </p>
              <button className="btn-primary clay-button-interactive" onClick={() => navigateToTab("themes")}>
                Ver Todos los Wrappers
              </button>
            </div>
          )
        )}

        {activeTab === "blog" && (
          <BlogJournal
            entries={blogEntries}
            themes={themes}
            selectedThemeFilter={selectedThemeFilter}
            onSelectThemeFilter={setSelectedThemeFilter}
            onOpenCreateEntry={() => handleOpenEditor(undefined, selectedThemeFilter || undefined)}
            onEditEntry={entry => handleOpenEditor(entry.id, entry.themeId)}
            onDeleteEntry={handleDeleteBlogEntry}
            onOpenReader={entry => handleOpenEntry(entry.id)}
            onOpenWrapperStudio={handleOpenWrapperStudio}
          />
        )}

        {/* Dedicated Full-Route Markdown Editor (No Modal) */}
        {activeTab === "editor" && (
          <BlogEditorPage
            themes={themes}
            initialThemeId={editorThemeId}
            entryToEdit={activeEditingEntry}
            onSave={handleSaveBlogEntry}
            onBack={handleBackToBlog}
          />
        )}

        {/* Dedicated Full-Route Single Column Markdown Sheet Reader (No Modal) */}
        {activeTab === "entry" && (
          activeViewingEntry ? (
            <BlogEntryViewPage
              entry={activeViewingEntry}
              themes={themes}
              allEntries={blogEntries}
              onBack={handleBackToBlog}
              onEdit={entry => handleOpenEditor(entry.id, entry.themeId)}
              onDelete={handleDeleteBlogEntry}
              onSelectEntry={id => handleOpenEntry(id)}
            />
          ) : (
            <div className="single-column-sheet" style={{ textAlign: "center", padding: "80px 20px" }}>
              <h2 className="title-lg" style={{ fontFamily: "var(--font-display)" }}>Entrada no encontrada</h2>
              <p className="body-md" style={{ color: "var(--color-muted)", margin: "12px 0 24px" }}>
                La entrada solicitada no existe o fue eliminada de la bitácora.
              </p>
              <button className="btn-primary clay-button-interactive" onClick={handleBackToBlog}>
                Volver a Bitácora
              </button>
            </div>
          )
        )}

        {activeTab === "design" && (
          <DesignSystemVisualizer />
        )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "var(--color-surface-soft)",
          borderTop: "1px solid var(--color-hairline)",
          padding: "60px var(--spacing-xl) 40px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <FireGoatLogo size={24} withGlow={false} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>
                Horizon 2027 · Todo empieza contigo
              </span>
              <span
                className="badge-pill"
                style={{
                  fontSize: 11,
                  background: "var(--color-surface-card)",
                  color: "var(--color-brand-coral)",
                  fontWeight: 700,
                  border: "1px solid var(--color-hairline)",
                }}
              >
                Everything starts with you
              </span>
            </div>
            <p className="body-sm" style={{ color: "var(--color-muted)", margin: 0 }}>
              Wrappers, Bitácora Markdown y Calendario de 365 días (Q1-Q4) hacia la conquista del 2027.
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span className="badge-pill">D- {countdown.days} días restantes</span>
            <button
              className="btn-secondary btn-sm"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Volver arriba ↑
            </button>
          </div>
        </div>
      </footer>

      {/* Modals for Themes & Auth */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        onSave={handleSaveTheme}
        themeToEdit={themeToEdit}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthInitialMode("signin");
        }}
        initialMode={authInitialMode}
        user={user}
        onSignOut={handleSignOut}
        onAuthSuccess={async () => {
          if (supabase) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
              await syncLocalToSupabase(session.user.id);
              const loadedThemes = await getThemes(session.user.id);
              const loadedBlogs = await getBlogEntries(session.user.id);
              setThemes(loadedThemes);
              setBlogEntries(loadedBlogs);
            }
          }
        }}
      />

      {/* Quick Action Sheet Modal (Tactile Mobile & Desktop affordance) */}
      <QuickActionSheet
        isOpen={isQuickActionSheetOpen}
        onClose={() => setIsQuickActionSheetOpen(false)}
        onWriteEntry={() => handleOpenEditor()}
        onAddTheme={() => {
          setThemeToEdit(null);
          setIsThemeModalOpen(true);
        }}
      />

      {/* Sticky Bottom Navigation for Tablet & Mobile (5 slots with elevated action FAB) */}
      {activeTab !== 'editor' && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          onOpenQuickAction={() => setIsQuickActionSheetOpen(true)}
        />
      )}
      </div>
    </WrapperProvider>
  );
};

export default App;
