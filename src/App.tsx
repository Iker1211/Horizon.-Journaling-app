import React, { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, BookOpen, CalendarDays, Layers, LockKeyhole } from "lucide-react";
import { ActiveTab, AvatarCharacterId, BigTheme, BlogEntry, UserProfile } from "./types";
import { getCountdownTo2027, CountdownTime } from "./utils/dates";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import {
  getThemes,
  saveThemeItem,
  deleteThemeItem,
  getBlogEntries,
  saveBlogEntryItem,
  deleteBlogEntryItem,
} from "./services/db";
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
import { WrapperStudioPage } from "./components/WrapperStudioPage";
import { WrapperProvider } from "./context/WrapperContext";
import { useAndroidBackHandler } from "./hooks/useAndroidBackHandler";
import { useAuthCallback } from "./hooks/useAuthCallback";
import { ProfilePage } from "./components/ProfilePage";
import { getOrCreateProfile, loadAvatarObjectUrl, removeAvatar, selectAvatarCharacter, updateProfile, uploadAvatar } from "./services/profile";
import { getAppStartDate, saveAppStartDate } from "./utils/quarters";
import { canLeaveEntry } from './utils/entryDraft';
import { clearGoogleAuthenticationState } from './services/googleAuth';

export const App: React.FC = () => {
  // Navigation & Route state
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [editorEntryId, setEditorEntryId] = useState<string | null>(null);
  const [editorThemeId, setEditorThemeId] = useState<string | null>(null);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [activeWrapperStudioId, setActiveWrapperStudioId] = useState<string | null>(null);
  const lastRouteRef = useRef(window.location.hash);
  const approvedRouteRef = useRef<string | null>(null);
  const continueAfterWrapper = useRef(false);
  const journalScrollRef = useRef(0);
  const [journalQuery, setJournalQuery] = useState('');
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  // Supabase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const sessionEpoch = useRef(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>("signin");
  const [authModalError, setAuthModalError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileOwnerId, setProfileOwnerId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarUrlRef = useRef<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileReloadVersion, setProfileReloadVersion] = useState(0);
  const [isProfileDirty, setIsProfileDirty] = useState(false);

  const replaceAvatarUrl = useCallback((next: string | null) => {
    if (avatarUrlRef.current) URL.revokeObjectURL(avatarUrlRef.current);
    avatarUrlRef.current = next;
    setAvatarUrl(next);
  }, []);

  const handleRecoveryCallback = useCallback(() => {
    setAuthError(null);
    setAuthModalError(null);
    setAuthInitialMode("update-password");
    setIsAuthModalOpen(true);
  }, []);

  const handleAuthCallbackSuccess = useCallback((returnToProfile = false) => {
    setAuthError(null);
    setAuthModalError(null);
    setIsAuthModalOpen(false);
    if (returnToProfile) {
      setActiveTab('profile');
      window.location.hash = '#/profile';
    }
  }, []);

  const handleAuthCallbackError = useCallback((message: string) => {
    setAuthModalError(message);
    setAuthInitialMode("signin");
    setIsAuthModalOpen(true);
  }, []);

  useAuthCallback(supabase, {
    onRecovery: handleRecoveryCallback,
    onSuccess: handleAuthCallbackSuccess,
    onError: handleAuthCallbackError,
  });

  // Domain Data State
  const [accountData, setAccountData] = useState<{
    ownerId: string | null;
    themes: BigTheme[];
    blogEntries: BlogEntry[];
  }>({ ownerId: null, themes: [], blogEntries: [] });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const ownsLoadedData = Boolean(user && accountData.ownerId === user.id);
  const themes = ownsLoadedData ? accountData.themes : [];
  const blogEntries = ownsLoadedData ? accountData.blogEntries : [];

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
    hasUnsavedChanges: activeTab === 'profile' && isProfileDirty,
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
      const nextRoute = window.location.hash;
      if (nextRoute !== lastRouteRef.current && approvedRouteRef.current !== nextRoute && !canLeaveEntry()) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${lastRouteRef.current}`);
        return;
      }
      approvedRouteRef.current = null;
      lastRouteRef.current = nextRoute;
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (!hash || hash === "dashboard") {
        setActiveTab("dashboard");
      } else if (hash === "calendar") {
        setActiveTab("calendar");
      } else if (hash === "themes") {
        setActiveTab("themes");
      } else if (hash === "blog") {
        setActiveTab("blog");
      } else if (hash === "profile") {
        setActiveTab("profile");
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

  // Auth callbacks only update state. Cloud reads run outside the auth callback lock.
  useEffect(() => {
    let disposed = false;
    let receivedAuthEvent = false;
    const applyUser = (nextUser: User | null) => {
      if (disposed) return;
      const previousId = userIdRef.current;
      const nextId = nextUser?.id ?? null;
      if (previousId !== nextId) {
        if (previousId) clearGoogleAuthenticationState();
        userIdRef.current = nextId;
        sessionEpoch.current += 1;
        setAccountData({ ownerId: null, themes: [], blogEntries: [] });
        setDataError(null);
        setOperationError(null);
        setSelectedThemeFilter(null);
        setJournalQuery('');
        setSavedEntryId(null);
        setThemeToEdit(null);
        setIsThemeModalOpen(false);
        setIsQuickActionSheetOpen(false);
        setProfile(null);
        setProfileOwnerId(null);
        setProfileError(null);
        setIsProfileDirty(false);
        replaceAvatarUrl(null);
        // Account changes must not carry another account's private route into the new session.
        if (previousId) {
          setEditorEntryId(null);
          setEditorThemeId(null);
          setViewingEntryId(null);
          setActiveWrapperStudioId(null);
          setActiveTab("dashboard");
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/dashboard`);
        }
      }
      setUser(nextUser);
      setAuthError(null);
      setIsAuthReady(true);
    };

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthReady(true);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      receivedAuthEvent = true;
      applyUser(session?.user ?? null);
      if (!disposed && event === "PASSWORD_RECOVERY") {
        handleRecoveryCallback();
      }
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (disposed || receivedAuthEvent) return;
      if (error) {
        setAuthError("No pudimos comprobar tu sesión. Vuelve a intentarlo.");
        setIsAuthReady(true);
        return;
      }
      applyUser(session?.user ?? null);
    }).catch(() => {
      if (!disposed && !receivedAuthEvent) {
        setAuthError("No pudimos comprobar tu sesión. Vuelve a intentarlo.");
        setIsAuthReady(true);
      }
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, [handleRecoveryCallback, replaceAvatarUrl]);

  useEffect(() => () => {
    if (avatarUrlRef.current) URL.revokeObjectURL(avatarUrlRef.current);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const epoch = sessionEpoch.current;
    let disposed = false;
    setIsProfileLoading(true);
    setProfileError(null);
    getOrCreateProfile(userId, getAppStartDate(userId)).then(async loadedProfile => {
      if (disposed || epoch !== sessionEpoch.current || userIdRef.current !== userId) return;
      setProfile(loadedProfile);
      setProfileOwnerId(userId);
      saveAppStartDate(loadedProfile.cycleStartDate, userId);
      try {
        const loadedAvatar = await loadAvatarObjectUrl(userId, loadedProfile.avatarPath);
        if (disposed || epoch !== sessionEpoch.current || userIdRef.current !== userId) {
          if (loadedAvatar) URL.revokeObjectURL(loadedAvatar);
          return;
        }
        replaceAvatarUrl(loadedAvatar);
      } catch {
        if (!disposed && epoch === sessionEpoch.current && userIdRef.current === userId) replaceAvatarUrl(null);
      }
    }).catch(() => {
      if (disposed || epoch !== sessionEpoch.current || userIdRef.current !== userId) return;
      setProfile(null);
      setProfileOwnerId(userId);
      setProfileError('No pudimos cargar el perfil. Comprueba tu conexión y vuelve a intentarlo.');
    }).finally(() => {
      if (!disposed && epoch === sessionEpoch.current && userIdRef.current === userId) setIsProfileLoading(false);
    });
    return () => { disposed = true; };
  }, [user?.id, profileReloadVersion, replaceAvatarUrl]);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const epoch = sessionEpoch.current;
    let disposed = false;
    setIsDataLoading(true);
    setDataError(null);

    Promise.all([getThemes(userId), getBlogEntries(userId)]).then(([loadedThemes, loadedBlogs]) => {
      if (disposed || epoch !== sessionEpoch.current || userIdRef.current !== userId) return;
      setAccountData({ ownerId: userId, themes: loadedThemes, blogEntries: loadedBlogs });
    }).catch(() => {
      if (disposed || epoch !== sessionEpoch.current || userIdRef.current !== userId) return;
      setDataError("No pudimos cargar tu espacio. Comprueba tu conexión y vuelve a intentarlo.");
    }).finally(() => {
      if (!disposed && epoch === sessionEpoch.current && userIdRef.current === userId) {
        setIsDataLoading(false);
      }
    });

    return () => { disposed = true; };
  }, [user?.id, reloadVersion]);

  // --- Route Handlers ---
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [activeTab, viewingEntryId, isDataLoading]);

  const navigateToTab = (tab: ActiveTab) => {
    if (!canLeaveEntry()) return;
    if (activeTab === 'profile' && tab !== 'profile' && isProfileDirty && !window.confirm('Tienes cambios sin guardar. ¿Quieres salir sin guardarlos?')) return;
    approvedRouteRef.current = `#/${tab}`;
    setActiveTab(tab);
    if (tab === "dashboard" || tab === "calendar" || tab === "themes" || tab === "blog" || tab === "profile") {
      window.location.hash = `#/${tab}`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleOpenWrapperStudio = (wrapperId: string) => {
    if (!canLeaveEntry()) return;
    approvedRouteRef.current = `#/w/${wrapperId}`;
    setActiveWrapperStudioId(wrapperId);
    setActiveTab("wrapper-studio");
    window.location.hash = `#/w/${wrapperId}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenEditor = (entryId?: string, themeId?: string) => {
    if (activeTab === 'editor' && (entryId || null) === editorEntryId) return;
    if (!canLeaveEntry()) return;
    if (!themes.length && !entryId) {
      continueAfterWrapper.current = true;
      setThemeToEdit(null);
      setIsThemeModalOpen(true);
      return;
    }
    setEditorEntryId(entryId || null);
    setEditorThemeId(themeId || selectedThemeFilter || null);
    approvedRouteRef.current = entryId ? `#/write?edit=${entryId}` : (themeId || selectedThemeFilter) ? `#/write?theme=${themeId || selectedThemeFilter}` : '#/write';
    setActiveTab("editor");
    window.location.hash = approvedRouteRef.current;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenEntry = (entryId: string) => {
    if (!canLeaveEntry()) return;
    if (activeTab === 'blog') journalScrollRef.current = window.scrollY;
    approvedRouteRef.current = `#/entry/${entryId}`;
    setViewingEntryId(entryId);
    setActiveTab("entry");
    window.location.hash = `#/entry/${entryId}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToBlog = () => {
    if (!canLeaveEntry()) return;
    const returnEntryId = viewingEntryId || editorEntryId;
    approvedRouteRef.current = '#/blog';
    setActiveTab("blog");
    setViewingEntryId(null);
    setEditorEntryId(null);
    window.location.hash = "#/blog";
    requestAnimationFrame(() => {
      window.scrollTo({ top: journalScrollRef.current, behavior: 'instant' });
      if (returnEntryId) document.getElementById(`journal-entry-${returnEntryId}`)?.focus({ preventScroll: true });
    });
  };

  const requireCurrentAccount = () => {
    if (!user?.id || userIdRef.current !== user.id) {
      throw new Error("Inicia sesión para guardar tus cambios.");
    }
    return { userId: user.id, epoch: sessionEpoch.current };
  };

  const isCurrentAccount = (userId: string, epoch: number) =>
    userIdRef.current === userId && sessionEpoch.current === epoch;

  // Save errors propagate to forms so failed writes never close the editor or discard a draft.
  const handleSaveTheme = async (theme: BigTheme) => {
    const { userId, epoch } = requireCurrentAccount();
    await saveThemeItem(theme, userId);
    if (!isCurrentAccount(userId, epoch)) throw new Error("Tu sesión ha cambiado.");
    setAccountData(previous => previous.ownerId === userId ? { ...previous, themes: [...previous.themes.filter(item => item.id !== theme.id), theme] } : previous);
    setOperationError(null);
    if (continueAfterWrapper.current) {
      continueAfterWrapper.current = false;
      setEditorEntryId(null);
      setEditorThemeId(theme.id);
      approvedRouteRef.current = `#/write?theme=${theme.id}`;
      window.location.hash = approvedRouteRef.current;
      setActiveTab('editor');
      window.scrollTo(0, 0);
    }
  };

  const handleDeleteTheme = async (id: string) => {
    const { userId, epoch } = requireCurrentAccount();
    try {
      await deleteThemeItem(id, userId);
      // Deleting a wrapper also deletes its entries through the database relationship.
      const [updatedThemes, updatedBlogs] = await Promise.all([getThemes(userId), getBlogEntries(userId)]);
      if (!isCurrentAccount(userId, epoch)) return;
      setAccountData({ ownerId: userId, themes: updatedThemes, blogEntries: updatedBlogs });
      if (selectedThemeFilter === id) setSelectedThemeFilter(null);
      setOperationError(null);
    } catch {
      if (isCurrentAccount(userId, epoch)) setOperationError("No pudimos eliminar el wrapper. Vuelve a intentarlo.");
    }
  };

  const handleSaveBlogEntry = async (entry: BlogEntry) => {
    const { userId, epoch } = requireCurrentAccount();
    await saveBlogEntryItem(entry, userId);
    if (!isCurrentAccount(userId, epoch)) throw new Error("Tu sesión ha cambiado.");
    setAccountData(previous => previous.ownerId === userId ? { ...previous, blogEntries: [entry, ...previous.blogEntries.filter(item => item.id !== entry.id)] } : previous);
    setOperationError(null);
  };

  const handleDeleteBlogEntry = async (id: string) => {
    const { userId, epoch } = requireCurrentAccount();
    try {
      await deleteBlogEntryItem(id, userId);
      if (!isCurrentAccount(userId, epoch)) throw new Error('Tu sesión ha cambiado.');
      setAccountData(previous => previous.ownerId === userId ? { ...previous, blogEntries: previous.blogEntries.filter(entry => entry.id !== id) } : previous);
      setOperationError(null);
    } catch {
      if (isCurrentAccount(userId, epoch)) setOperationError("No pudimos eliminar la entrada. Vuelve a intentarlo.");
      throw new Error('No pudimos eliminar la entrada. Vuelve a intentarlo.');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      userIdRef.current = null;
      sessionEpoch.current += 1;
      setUser(null);
      setAccountData({ ownerId: null, themes: [], blogEntries: [] });
      setIsAuthModalOpen(false);
      setIsThemeModalOpen(false);
      setIsQuickActionSheetOpen(false);
      setOperationError(null);
      setProfile(null);
      setProfileOwnerId(null);
      setProfileError(null);
      replaceAvatarUrl(null);
    } catch {
      setOperationError("No pudimos cerrar la sesión. Vuelve a intentarlo.");
      throw new Error("No pudimos cerrar la sesión. Vuelve a intentarlo.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleProfileSave = async (patch: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'cycleStartDate'>>) => {
    const { userId, epoch } = requireCurrentAccount();
    const updated = await updateProfile(userId, patch);
    if (!isCurrentAccount(userId, epoch)) throw new Error('Tu sesión ha cambiado.');
    setProfile(updated);
    setProfileOwnerId(userId);
    setIsProfileDirty(false);
    if (updated.cycleStartDate) saveAppStartDate(updated.cycleStartDate, userId);
  };

  const handleAvatarSave = async (blob: Blob) => {
    const { userId, epoch } = requireCurrentAccount();
    const updated = await uploadAvatar(userId, blob, profile?.avatarVersion ?? 0);
    const nextUrl = await loadAvatarObjectUrl(userId, updated.avatarPath);
    if (!isCurrentAccount(userId, epoch)) {
      if (nextUrl) URL.revokeObjectURL(nextUrl);
      throw new Error('Tu sesión ha cambiado.');
    }
    setProfile(updated);
    setProfileOwnerId(userId);
    replaceAvatarUrl(nextUrl);
  };

  const handleAvatarRemove = async () => {
    const { userId, epoch } = requireCurrentAccount();
    const updated = await removeAvatar(userId);
    if (!isCurrentAccount(userId, epoch)) throw new Error('Tu sesión ha cambiado.');
    setProfile(updated);
    replaceAvatarUrl(null);
  };

  const handleAvatarCharacterSelect = async (characterId: AvatarCharacterId | null) => {
    const { userId, epoch } = requireCurrentAccount();
    const updated = await selectAvatarCharacter(userId, characterId);
    if (!isCurrentAccount(userId, epoch)) throw new Error('Tu sesión ha cambiado.');
    setProfile(updated);
    setProfileOwnerId(userId);
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
    ? themes.find(t => t.id === activeWrapperStudioId) || null
    : null;

  const authModal = (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => {
        setIsAuthModalOpen(false);
        setAuthInitialMode("signin");
        setAuthModalError(null);
      }}
      initialMode={authInitialMode}
      initialError={authModalError}
      user={user}
      onSignOut={handleSignOut}
      onAuthSuccess={() => setIsAuthModalOpen(false)}
    />
  );

  let page: React.ReactNode;
  if (!isAuthReady || isSigningOut) {
    page = <main className="welcome-screen"><div className="welcome-content app-status" role="status"><FireGoatLogo size={48} /><p>{isSigningOut ? 'Cerrando sesión…' : 'Abriendo Horizon…'}</p></div></main>;
  } else if (!user) {
    page = (
      <div className="app-shell app-shell-public">
        <header className="welcome-brand"><FireGoatLogo size={32} withGlow={false} /><span>Horizon</span></header>
        <main className="welcome-screen">
          <div className="welcome-content">
            <div className="welcome-eyebrow">UN ESPACIO PARA LO QUE IMPORTA</div>
            <h1 className="welcome-title">
              <span>Todo empieza contigo.</span>
              <em>Conquista tu horizonte desde hoy.</em>
            </h1>
            <p className="welcome-description">Organiza tus proyectos, escribe lo que aprendes y convierte cada reflexión en un paso hacia el horizonte que quieres construir.</p>
            {authError && <p className="app-error" role="alert">{authError}</p>}
            {isSupabaseConfigured ? (
              <div className="welcome-actions">
                <button className="btn-primary" onClick={() => { setAuthInitialMode("signup"); setIsAuthModalOpen(true); }}>Crear mi espacio <ArrowRight size={18} /></button>
                <button className="btn-secondary" onClick={() => { setAuthInitialMode("signin"); setIsAuthModalOpen(true); }}>Iniciar sesión</button>
              </div>
            ) : <p className="app-error" role="status">Horizon no está disponible en este momento. Inténtalo de nuevo más tarde.</p>}
            <p className="welcome-privacy"><LockKeyhole size={14} /> Tu espacio comienza con tu cuenta.</p>
            <div className="welcome-features">
              <div className="welcome-feature"><Layers size={22} /><h2>Todo en su lugar</h2><p>Reúne tus metas y proyectos en wrappers.</p></div>
              <div className="welcome-feature"><BookOpen size={22} /><h2>Ideas que permanecen</h2><p>Captura tus reflexiones en una bitácora.</p></div>
              <div className="welcome-feature"><CalendarDays size={22} /><h2>Un día a la vez</h2><p>Observa tu recorrido en el calendario.</p></div>
            </div>
          </div>
        </main>
      </div>
    );
  } else if (!ownsLoadedData || isDataLoading || dataError) {
    page = (
      <div className="app-shell">
        <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Ir al contenido</a>
        <header className="welcome-brand"><FireGoatLogo size={32} withGlow={false} /><span>Horizon</span></header>
        <main id="main-content" tabIndex={-1} className="welcome-screen"><div className="welcome-content app-status">
          {dataError ? <><h1>No pudimos conectar.</h1><p className="app-error" role="alert">{dataError}</p><button className="btn-primary" onClick={() => setReloadVersion(version => version + 1)}>Volver a intentar</button></> : <p role="status">Cargando tu espacio…</p>}
          <button className="btn-secondary" onClick={() => { void handleSignOut().catch(() => {}); }}>Cerrar sesión</button>
          {operationError && <p className="app-error" role="alert">{operationError}</p>}
        </div></main>
      </div>
    );
  } else {
    page = (
    <WrapperProvider
      key={user.id}
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
      <div className="app-shell">
        <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Ir al contenido</a>
        <Navbar
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          onOpenQuickEntry={() => handleOpenEditor()}
          userEmail={user?.email || null}
          userDisplayName={profileOwnerId === user.id ? profile?.displayName || null : null}
          userAvatarUrl={profileOwnerId === user.id ? avatarUrl : null}
          userAvatarCharacter={profileOwnerId === user.id ? profile?.avatarCharacter : null}
          onOpenAuth={() => navigateToTab('profile')}
        />

        <main id="main-content" tabIndex={-1} className="app-main-layout" style={{ flex: 1 }}>
          {savedEntryId && activeTab === 'entry' && viewingEntryId === savedEntryId && <p className="entry-saved-confirmation" role="status">Entrada guardada en tu cuenta.<button type="button" aria-label="Cerrar confirmación" onClick={() => setSavedEntryId(null)}>×</button></p>}
          {operationError && <div className="app-error app-operation-error" role="alert">{operationError}<button onClick={() => setOperationError(null)} aria-label="Cerrar aviso">×</button></div>}
          {activeTab === "dashboard" && (
            <Dashboard
              userId={user.id}
              cycleStartDate={profileOwnerId === user.id ? profile?.cycleStartDate : undefined}
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
              onCreateWrapper={() => { continueAfterWrapper.current = !themes.length; setThemeToEdit(null); setIsThemeModalOpen(true); }}
              onResumeDraft={id => handleOpenEditor(id || undefined)}
            />
          )}

        {activeTab !== "dashboard" && (
          <div className="main-content" style={{ marginTop: 24 }}>
            {activeTab === "calendar" && (
          <CalendarCountdown
            userId={user.id}
            cycleStartDate={profileOwnerId === user.id ? profile?.cycleStartDate : undefined}
            onCycleStartDateChange={async cycleStartDate => handleProfileSave({ cycleStartDate })}
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
              userId={user.id}
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
            searchQuery={journalQuery}
            onSearchQueryChange={setJournalQuery}
            userId={user.id}
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

        {activeTab === "profile" && (
          <ProfilePage
            key={user.id}
            user={user}
            profile={profileOwnerId === user.id ? profile : null}
            avatarUrl={profileOwnerId === user.id ? avatarUrl : null}
            loading={isProfileLoading}
            error={profileError}
            onRetry={() => setProfileReloadVersion(version => version + 1)}
            onSave={handleProfileSave}
            onAvatarSave={handleAvatarSave}
            onAvatarRemove={handleAvatarRemove}
            onAvatarCharacterSelect={handleAvatarCharacterSelect}
            onSignOut={handleSignOut}
            onDirtyChange={setIsProfileDirty}
          />
        )}

        {/* Dedicated Full-Route Markdown Editor (No Modal) */}
        {activeTab === "editor" && (
          editorEntryId && !activeEditingEntry ? (
            <div className="single-column-sheet app-status">
              <h1 className="title-lg">Entrada no encontrada</h1>
              <p>Esta entrada no está disponible en tu cuenta.</p>
              <button className="btn-primary" onClick={handleBackToBlog}>Volver a Bitácora</button>
            </div>
          ) : !themes.length ? (
            <div className="single-column-sheet app-status">
              <h1 className="title-lg">Primero, crea un wrapper</h1>
              <p>Elige un proyecto o un tema para organizar tus primeras reflexiones.</p>
              <button className="btn-primary" onClick={() => { setThemeToEdit(null); setIsThemeModalOpen(true); }}>Crear un wrapper</button>
            </div>
          ) : <BlogEditorPage
            key={`${user.id}:${editorEntryId || 'new'}`}
            userId={user.id}
            themes={themes}
            initialThemeId={editorThemeId}
            entryToEdit={activeEditingEntry}
            onSave={handleSaveBlogEntry}
            onSaved={entry => { setSavedEntryId(entry.id); handleOpenEntry(entry.id); }}
            onBack={handleBackToBlog}
          />
        )}

        {/* Dedicated Full-Route Single Column Markdown Sheet Reader (No Modal) */}
        {activeTab === "entry" && (
          activeViewingEntry ? (
            <BlogEntryViewPage
              key={activeViewingEntry.id}
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
          </div>
        )}
      </main>

      <footer className="app-footer"><span>Horizon</span><span>Un día a la vez.</span></footer>

      {/* Modals for Themes & Auth */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => { continueAfterWrapper.current = false; setIsThemeModalOpen(false); }}
        onSave={handleSaveTheme}
        themeToEdit={themeToEdit}
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
          onOpenQuickAction={() => handleOpenEditor()}
        />
      )}
      </div>
    </WrapperProvider>
    );
  }

  // Keep auth mounted across account/data transitions so recovery forms retain their state.
  return <>{page}{authModal}</>;
};

export default App;
