import React, { useState, useMemo } from 'react';
import {
  Palette,
  Copy,
  Check,
  Sparkles,
  Layers,
  Type,
  Maximize2,
  Box,
  Code2,
  X,
  Search,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  CHINESE_ZODIAC_ANIMALS,
  ChineseZodiacSign,
  RatLogo,
  OxLogo,
  TigerLogo,
  RabbitLogo,
  DragonLogo,
  SnakeLogo,
  HorseLogo,
  FireGoatLogo,
  MonkeyLogo,
  RoosterLogo,
  DogLogo,
  PigLogo,
  HorizonGoatLogo,
  Clay2027Logo,
} from './ChineseZodiacLogos';
import { ClayIllustration } from './ClayIllustration';

type SubSection = 'tokens' | 'components' | 'assets' | 'playground';
type ColorCategory = 'all' | 'brand' | 'surface' | 'semantic';

interface ColorToken {
  name: string;
  role: string;
  hex: string;
  cssVar: string;
  category: 'brand' | 'surface' | 'semantic';
  contrast: 'dark' | 'light';
  description: string;
}

const COLOR_TOKENS: ColorToken[] = [
  // Brand Saturated Clay Colors (GEMINI.md)
  { name: 'Brand Pink', role: 'Feature card & vibrant accent', hex: '#ff4d8b', cssVar: '--color-brand-pink', category: 'brand', contrast: 'dark', description: 'Saturado de impacto para tarjetas y badges' },
  { name: 'Brand Teal', role: 'Deep contrast & dark elevation', hex: '#1a3a3a', cssVar: '--color-brand-teal', category: 'brand', contrast: 'dark', description: 'Verde azulado profundo, base de contraste dark' },
  { name: 'Brand Lavender', role: 'Soft creative accent', hex: '#b8a4ed', cssVar: '--color-brand-lavender', category: 'brand', contrast: 'light', description: 'Lavanda suave táctil para tarjetas de diseño' },
  { name: 'Brand Peach', role: 'Warm optimism accent', hex: '#ffb084', cssVar: '--color-brand-peach', category: 'brand', contrast: 'light', description: 'Melocotón cálido para amaneceres y visión' },
  { name: 'Brand Ochre', role: 'Golden ambition & wealth', hex: '#e8b94a', cssVar: '--color-brand-ochre', category: 'brand', contrast: 'light', description: 'Ocre dorado para logros y progreso material' },
  { name: 'Brand Mint', role: 'Fresh energy & vital balance', hex: '#a4d4c5', cssVar: '--color-brand-mint', category: 'brand', contrast: 'light', description: 'Menta refrescante para salud y bienestar' },
  { name: 'Brand Coral', role: 'Fire Goat spirit & CTA', hex: '#ff6b5a', cssVar: '--color-brand-coral', category: 'brand', contrast: 'dark', description: 'Coral fuego del 2027, acción y urgencia vital' },

  // Surfaces & Canvas (GEMINI.md)
  { name: 'Canvas', role: 'Lienzo principal cálido', hex: '#fffaf0', cssVar: '--color-canvas', category: 'surface', contrast: 'light', description: 'Fondo marfil cálido oficial de Clay.com' },
  { name: 'Surface Soft', role: 'Superficie de soporte suave', hex: '#faf5e8', cssVar: '--color-surface-soft', category: 'surface', contrast: 'light', description: 'Contenedores secundarios y bandas de hero' },
  { name: 'Surface Card', role: 'Fondo de tarjetas y pastillas', hex: '#f5f0e0', cssVar: '--color-surface-card', category: 'surface', contrast: 'light', description: 'Tarjetas de información y tabs activos' },
  { name: 'Surface Strong', role: 'Bordes y extrusión táctil', hex: '#ebe6d6', cssVar: '--color-surface-strong', category: 'surface', contrast: 'light', description: 'Bisel inferior para efecto 3D táctil' },
  { name: 'Surface Dark', role: 'Superficie oscura profunda', hex: '#0a1a1a', cssVar: '--color-surface-dark', category: 'surface', contrast: 'dark', description: 'Bloques de código y contraste máximo' },
  { name: 'Surface Dark Elevated', role: 'Superficie oscura elevada', hex: '#1a2a2a', cssVar: '--color-surface-dark-elevated', category: 'surface', contrast: 'dark', description: 'Encabezados oscuros y paneles de código' },

  // Neutrals & Ink (GEMINI.md)
  { name: 'Primary / Ink', role: 'Texto principal y CTA primario', hex: '#0a0a0a', cssVar: '--color-primary', category: 'surface', contrast: 'dark', description: 'Negro grafito profundo para máxima legibilidad' },
  { name: 'Body Text', role: 'Cuerpo de texto general', hex: '#3a3a3a', cssVar: '--color-body', category: 'surface', contrast: 'dark', description: 'Gris oscuro cómodo para párrafos largos' },
  { name: 'Muted', role: 'Metadatos y enlaces inactivos', hex: '#6a6a6a', cssVar: '--color-muted', category: 'surface', contrast: 'dark', description: 'Texto secundario, fechas y conteos' },
  { name: 'Hairline', role: 'Líneas de división y bordes', hex: '#e5e5e5', cssVar: '--color-hairline', category: 'surface', contrast: 'light', description: 'Borde sutil que delimita sin saturar' },

  // Semantic Feedback
  { name: 'Success', role: 'Metas completadas y check', hex: '#22c55e', cssVar: '--color-success', category: 'semantic', contrast: 'dark', description: 'Verde esmeralda para celebraciones' },
  { name: 'Warning', role: 'Prioridad alta y atención', hex: '#f59e0b', cssVar: '--color-warning', category: 'semantic', contrast: 'dark', description: 'Ámbar táctil para recordatorios y fechas próximas' },
  { name: 'Error', role: 'Estados críticos o eliminación', hex: '#ef4444', cssVar: '--color-error', category: 'semantic', contrast: 'dark', description: 'Rojo carmesí para alertas y borrado' },
];

const TYPOGRAPHY_SCALE = [
  { role: 'display-xl', token: '--text-display-xl', size: '72px', lineHeight: '1.0', letterSpacing: '-2.5px', weight: '500' },
  { role: 'display-lg', token: '--text-display-lg', size: '56px', lineHeight: '1.05', letterSpacing: '-2.0px', weight: '500' },
  { role: 'display-md', token: '--text-display-md', size: '40px', lineHeight: '1.1', letterSpacing: '-1.0px', weight: '500' },
  { role: 'display-sm', token: '--text-display-sm', size: '32px', lineHeight: '1.15', letterSpacing: '-0.5px', weight: '500' },
  { role: 'title-lg', token: '--text-title-lg', size: '24px', lineHeight: '1.3', letterSpacing: '-0.3px', weight: '600' },
  { role: 'title-md', token: '--text-title-md', size: '18px', lineHeight: '1.4', letterSpacing: '0px', weight: '600' },
  { role: 'title-sm', token: '--text-title-sm', size: '16px', lineHeight: '1.4', letterSpacing: '0px', weight: '600' },
  { role: 'body-md', token: '--text-body-md', size: '16px', lineHeight: '1.55', letterSpacing: '0px', weight: '400' },
  { role: 'body-sm', token: '--text-body-sm', size: '14px', lineHeight: '1.55', letterSpacing: '0px', weight: '400' },
  { role: 'caption', token: '--text-caption', size: '13px', lineHeight: '1.4', letterSpacing: '0px', weight: '400' },
  { role: 'caption-uppercase', token: '--text-caption-uppercase', size: '12px', lineHeight: '1.4', letterSpacing: '1.5px', weight: '600' },
  { role: 'button', token: '--text-button', size: '14px', lineHeight: '1.0', letterSpacing: '0px', weight: '500' },
  { role: 'nav-link', token: '--text-nav-link', size: '14px', lineHeight: '1.4', letterSpacing: '0px', weight: '500' },
];

const SPACING_SCALE = [
  { name: 'xxs', value: 4, token: '--spacing-xxs' },
  { name: 'xs', value: 8, token: '--spacing-xs' },
  { name: 'sm', value: 12, token: '--spacing-sm' },
  { name: 'md', value: 16, token: '--spacing-md' },
  { name: 'lg', value: 24, token: '--spacing-lg' },
  { name: 'xl', value: 32, token: '--spacing-xl' },
  { name: 'xxl', value: 48, token: '--spacing-xxl' },
  { name: 'section', value: 96, token: '--spacing-section' },
];

const RADIUS_SCALE = [
  { name: 'xs', value: '6px', token: '--radius-xs' },
  { name: 'sm', value: '8px', token: '--radius-sm' },
  { name: 'md', value: '12px', token: '--radius-md' },
  { name: 'lg', value: '16px', token: '--radius-lg' },
  { name: 'xl', value: '24px', token: '--radius-xl' },
  { name: 'pill', value: '9999px', token: '--radius-pill' },
];

export const DesignSystemVisualizer: React.FC = () => {
  const [activeSubSection, setActiveSubSection] = useState<SubSection>('tokens');

  // Tokens state
  const [colorFilter, setColorFilter] = useState<ColorCategory>('all');
  const [colorSearch, setColorSearch] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [customTypographyText, setCustomTypographyText] = useState('Horizon 2027 · Todo empieza contigo');

  // Assets state
  const [zodiacSize, setZodiacSize] = useState<number>(64);
  const [zodiacGlow, setZodiacGlow] = useState<boolean>(true);
  const [zodiacSearch, setZodiacSearch] = useState('');
  const [illustrationType, setIllustrationType] = useState<'mountain' | 'hourglass' | 'mascot' | 'stack'>('mountain');
  const [illustrationSize, setIllustrationSize] = useState<number>(200);
  const [illustrationBackdrop, setIllustrationBackdrop] = useState<'canvas' | 'soft' | 'dark' | 'card'>('soft');

  // Components state
  const [clickCount, setClickCount] = useState<number>(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  // Playground state
  const [pgColor, setPgColor] = useState<'pink' | 'teal' | 'lavender' | 'peach' | 'ochre' | 'mint' | 'coral' | 'cream'>('coral');
  const [pgAnimal, setPgAnimal] = useState<ChineseZodiacSign>('goat');
  const [pgBadge, setPgBadge] = useState('✦ CHECKPOINT 2027');
  const [pgTitle, setPgTitle] = useState('El Gran Año de la Cabra de Fuego');
  const [pgDesc, setPgDesc] = useState('Forja sistemas táctiles, hábitos consistentes y metas cuantificables hacia el horizonte 2027.');
  const [pgBtnType, setPgBtnType] = useState<'primary' | 'secondary' | 'on-color'>('primary');
  const [pgBtnLabel, setPgBtnLabel] = useState('Registrar Avance');
  const [pgShowSecondaryBtn, setPgShowSecondaryBtn] = useState(true);
  const [pgSecondaryLabel, setPgSecondaryLabel] = useState('Explorar Wrappers');

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(`¡${label} copiado: ${text}!`);
    setTimeout(() => {
      setCopiedNotification(null);
    }, 2400);
  };

  // Filtered colors
  const filteredColors = useMemo(() => {
    return COLOR_TOKENS.filter(c => {
      const matchesCat = colorFilter === 'all' || c.category === colorFilter;
      const matchesSearch =
        c.name.toLowerCase().includes(colorSearch.toLowerCase()) ||
        c.hex.toLowerCase().includes(colorSearch.toLowerCase()) ||
        c.cssVar.toLowerCase().includes(colorSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [colorFilter, colorSearch]);

  // Animal component lookup
  const renderZodiacLogo = (sign: ChineseZodiacSign, size: number, glow: boolean) => {
    switch (sign) {
      case 'rat': return <RatLogo size={size} withGlow={glow} />;
      case 'ox': return <OxLogo size={size} withGlow={glow} />;
      case 'tiger': return <TigerLogo size={size} withGlow={glow} />;
      case 'rabbit': return <RabbitLogo size={size} withGlow={glow} />;
      case 'dragon': return <DragonLogo size={size} withGlow={glow} />;
      case 'snake': return <SnakeLogo size={size} withGlow={glow} />;
      case 'horse': return <HorseLogo size={size} withGlow={glow} />;
      case 'goat': return <FireGoatLogo size={size} withGlow={glow} />;
      case 'monkey': return <MonkeyLogo size={size} withGlow={glow} />;
      case 'rooster': return <RoosterLogo size={size} withGlow={glow} />;
      case 'dog': return <DogLogo size={size} withGlow={glow} />;
      case 'pig': return <PigLogo size={size} withGlow={glow} />;
      default: return <FireGoatLogo size={size} withGlow={glow} />;
    }
  };

  // Filtered Zodiac animals
  const filteredZodiac = useMemo(() => {
    return CHINESE_ZODIAC_ANIMALS.filter(a => {
      const q = zodiacSearch.toLowerCase();
      return (
        a.nameEs.toLowerCase().includes(q) ||
        a.nameEn.toLowerCase().includes(q) ||
        a.chineseChar.includes(q) ||
        a.pinyin.toLowerCase().includes(q)
      );
    });
  }, [zodiacSearch]);

  // Generated React Code for Playground
  const generatedReactCode = useMemo(() => {
    const cardClass = `feature-card-${pgColor}`;
    const importName = pgAnimal === 'goat' ? 'FireGoatLogo' : `${pgAnimal.charAt(0).toUpperCase() + pgAnimal.slice(1)}Logo`;
    const btnClass = pgBtnType === 'primary' ? 'btn-primary' : pgBtnType === 'secondary' ? 'btn-secondary' : 'btn-on-color';

    return `import React from 'react';
import { ${importName} } from './components/ChineseZodiacLogos';

export const CustomClayCard: React.FC = () => {
  return (
    <div className="${cardClass} clay-button-interactive" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="badge-pill" style={{ backgroundColor: 'var(--color-surface-card)', fontWeight: 700 }}>
          ${pgBadge}
        </span>
        <${importName} size={48} withGlow={true} />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>
        ${pgTitle}
      </h3>

      <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.9, marginBottom: 20 }}>
        ${pgDesc}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button className="${btnClass} clay-button-interactive">
          ${pgBtnLabel}
        </button>
        ${
          pgShowSecondaryBtn
            ? `<button className="btn-secondary clay-button-interactive">
          ${pgSecondaryLabel}
        </button>`
            : ''
        }
      </div>
    </div>
  );
};`;
  }, [pgColor, pgAnimal, pgBadge, pgTitle, pgDesc, pgBtnType, pgBtnLabel, pgShowSecondaryBtn, pgSecondaryLabel]);

  return (
    <div className="ds-container">
      {/* --- HERO BANNER --- */}
      <section className="ds-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ maxWidth: 780 }}>
            <div className="ds-hero-badge">
              <Sparkles size={14} />
              <span>SISTEMA DE DISEÑO OFICIAL · HORIZON 2027</span>
            </div>
            <h1 className="ds-hero-title">
              Capa de Presentación & <span className="accent-coral">Clay 3D Tactile</span>
            </h1>
            <p className="ds-hero-desc">
              Basado en las especificaciones oficiales de <strong>GEMINI.md</strong> y la estética Clay.com:
              lienzo cálido <code>#fffaf0</code>, acentos saturados de arcilla esculpida, escala tipográfica de alto voltaje
              y micro-interacciones táctiles con biseles 3D extruidos.
            </p>
            <div className="ds-hero-stats">
              <div className="ds-hero-stat-pill">
                <Palette size={14} color="var(--color-brand-coral)" />
                <span>20 Tokens de Color</span>
              </div>
              <div className="ds-hero-stat-pill">
                <Type size={14} color="var(--color-brand-teal)" />
                <span>13 Escalas Tipográficas</span>
              </div>
              <div className="ds-hero-stat-pill">
                <Flame size={14} color="var(--color-brand-ochre)" />
                <span>12 Animales Zodiaco Chino</span>
              </div>
              <div className="ds-hero-stat-pill">
                <Code2 size={14} color="var(--color-brand-pink)" />
                <span>Playground Interactivo TSX</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px' }}>
            <FireGoatLogo size={90} withGlow={true} />
          </div>
        </div>
      </section>

      {/* --- SUBSECTION NAVIGATION TABS --- */}
      <div className="ds-subnav-wrapper">
        <nav className="ds-subnav" aria-label="Navegación del Sistema de Diseño">
          <button
            className={`ds-subnav-btn ${activeSubSection === 'tokens' ? 'active' : ''}`}
            onClick={() => setActiveSubSection('tokens')}
          >
            <Palette size={16} />
            <span>Tokens de Diseño</span>
          </button>
          <button
            className={`ds-subnav-btn ${activeSubSection === 'components' ? 'active' : ''}`}
            onClick={() => setActiveSubSection('components')}
          >
            <Box size={16} />
            <span>Componentes UI</span>
          </button>
          <button
            className={`ds-subnav-btn ${activeSubSection === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveSubSection('assets')}
          >
            <Flame size={16} />
            <span>Galería de Assets & Animales</span>
          </button>
          <button
            className={`ds-subnav-btn ${activeSubSection === 'playground' ? 'active' : ''}`}
            onClick={() => setActiveSubSection('playground')}
          >
            <SlidersHorizontal size={16} />
            <span>Sandbox / Playground</span>
          </button>
        </nav>
      </div>

      {/* =========================================================================
          SUB-SECTION 1: TOKENS DE DISEÑO
          ========================================================================= */}
      {activeSubSection === 'tokens' && (
        <div className="ds-section-block">
          {/* Colors */}
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <Palette size={24} color="var(--color-brand-coral)" />
                  Tokens de Color (Color Palette)
                </h2>
                <p>Haz clic sobre cualquier color para copiar su código HEX o variable CSS al portapapeles.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-soft)', padding: '4px 8px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-hairline)' }}>
                  <Search size={14} color="var(--color-muted)" />
                  <input
                    type="text"
                    placeholder="Buscar token o hex..."
                    value={colorSearch}
                    onChange={e => setColorSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--color-ink)', width: 150 }}
                  />
                  {colorSearch && (
                    <button onClick={() => setColorSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {(['all', 'brand', 'surface', 'semantic'] as ColorCategory[]).map(cat => (
                    <button
                      key={cat}
                      className={`category-tab ${colorFilter === cat ? 'active' : ''}`}
                      onClick={() => setColorFilter(cat)}
                      style={{ fontSize: 12, padding: '4px 12px' }}
                    >
                      {cat === 'all' && 'Todos'}
                      {cat === 'brand' && 'Brand Clay'}
                      {cat === 'surface' && 'Superficies'}
                      {cat === 'semantic' && 'Semántica'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ds-color-grid">
              {filteredColors.map(color => (
                <div
                  key={color.name}
                  className="ds-color-card"
                  onClick={() => copyToClipboard(color.hex, `${color.name} (HEX)`)}
                  title="Haz clic para copiar código HEX"
                >
                  <div
                    className="ds-color-swatch"
                    style={{
                      backgroundColor: color.hex,
                      borderBottom: color.contrast === 'light' ? '1px solid var(--color-hairline)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        color: '#ffffff',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      Copiar
                    </span>
                  </div>
                  <div className="ds-color-info">
                    <div className="ds-color-name">{color.name}</div>
                    <div className="ds-color-hex">
                      <span>{color.hex}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          copyToClipboard(`var(${color.cssVar})`, `${color.name} (Variable)`);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-brand-coral)',
                          padding: 2,
                        }}
                        title="Copiar var(--...)"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <div className="ds-color-var">{color.cssVar}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography Scale */}
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <Type size={24} color="var(--color-brand-teal)" />
                  Escala Tipográfica Viva (Typography Scale)
                </h2>
                <p>Escribe tu propio texto para previsualizar cómo rinde en cada uno de los 13 niveles tipográficos oficiales.</p>
              </div>

              <div className="ds-type-custom-input">
                <input
                  type="text"
                  className="input-text"
                  value={customTypographyText}
                  onChange={e => setCustomTypographyText(e.target.value)}
                  placeholder="Escribe texto personalizado..."
                  style={{ fontWeight: 600 }}
                />
              </div>
            </div>

            <div className="ds-type-list">
              {TYPOGRAPHY_SCALE.map(item => (
                <div key={item.role} className="ds-type-card">
                  <div className="ds-type-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="ds-type-token-badge">{item.token}</span>
                      <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-ink)' }}>
                        {item.role}
                      </strong>
                    </div>
                    <span className="ds-type-specs">
                      {item.size} · Line {item.lineHeight} · Letter {item.letterSpacing} · Weight {item.weight}
                    </span>
                  </div>

                  <div
                    className="ds-type-preview-box"
                    style={{
                      fontFamily: item.role.startsWith('display') ? 'var(--font-display)' : 'var(--font-primary)',
                      fontSize: item.size,
                      lineHeight: item.lineHeight,
                      letterSpacing: item.letterSpacing,
                      fontWeight: Number(item.weight),
                    }}
                  >
                    {customTypographyText || 'Horizon 2027'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Spacing Scale */}
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <Maximize2 size={24} color="var(--color-brand-ochre)" />
                  Escala de Espaciado (Spacing Scale)
                </h2>
                <p>Métricas precisas de padding, margin y gaps desde 4px (xxs) hasta 96px (section).</p>
              </div>
            </div>

            <div className="ds-spacing-grid">
              {SPACING_SCALE.map(sp => (
                <div key={sp.name} className="ds-spacing-card">
                  <div className="ds-spacing-header">
                    <span className="ds-spacing-token">{sp.token}</span>
                    <span className="ds-spacing-px">{sp.value}px</span>
                  </div>
                  <div className="ds-spacing-bar-container">
                    <div
                      className="ds-spacing-bar-fill"
                      style={{ width: `${Math.min(100, (sp.value / 96) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Border Radius Scale & Tactile Shadows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Radius */}
            <section className="ds-section">
              <div className="ds-section-header">
                <div className="ds-section-title-group">
                  <h2>
                    <Box size={22} color="var(--color-brand-peach)" />
                    Bordes Redondeados
                  </h2>
                  <p>Curvatura de arcilla moldeada</p>
                </div>
              </div>

              <div className="ds-radius-grid">
                {RADIUS_SCALE.map(r => (
                  <div key={r.name} className="ds-radius-card">
                    <div className="ds-radius-box" style={{ borderRadius: r.value }} />
                    <strong style={{ fontSize: 13, display: 'block', color: 'var(--color-ink)' }}>{r.name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Shadows */}
            <section className="ds-section">
              <div className="ds-section-header">
                <div className="ds-section-title-group">
                  <h2>
                    <Layers size={22} color="var(--color-brand-lavender)" />
                    Profundidad Clay 3D
                  </h2>
                  <p>Biseles extruidos y sombras táctiles</p>
                </div>
              </div>

              <div className="ds-shadow-grid">
                <div className="ds-shadow-card">
                  <div className="ds-shadow-pill" style={{ boxShadow: 'var(--shadow-clay-sm)' }}>
                    --shadow-clay-sm
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Elevación suave sutil</span>
                </div>

                <div className="ds-shadow-card">
                  <div className="ds-shadow-pill" style={{ boxShadow: 'var(--shadow-clay-md)' }}>
                    --shadow-clay-md
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Flotación intermedia</span>
                </div>

                <div className="ds-shadow-card">
                  <div className="ds-shadow-pill" style={{ boxShadow: 'var(--shadow-clay-lg)' }}>
                    --shadow-clay-lg
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Pop-out para modales</span>
                </div>

                <div className="ds-shadow-card">
                  <div className="ds-shadow-pill" style={{ boxShadow: '0 5px 0 #0a1a1a, 0 10px 20px rgba(0,0,0,0.1)' }}>
                    Extrusión Clay 3D
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Bisel sólido interactivo</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 2: COMPONENTES UI
          ========================================================================= */}
      {activeSubSection === 'components' && (
        <div className="ds-section-block">
          {/* Buttons Showcase */}
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <Box size={24} color="var(--color-brand-coral)" />
                  Botones Táctiles (Buttons & Actions)
                </h2>
                <p>Todos los estados: Primario, Secundario, Sobre Color, Deshabilitado, Tamaños e Interacciones vivas.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-surface-soft)' }}>
                  Clicks interactivos: <strong>{clickCount}</strong>
                </span>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setClickCount(0)}
                  title="Reiniciar contador"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="ds-component-group">
              <div className="ds-component-title">Botones Primarios (Dark Graphite #0a0a0a)</div>
              <div className="ds-buttons-wrap">
                <button className="btn-primary clay-button-interactive" onClick={() => setClickCount(c => c + 1)}>
                  <Sparkles size={16} />
                  <span>Primario Activo</span>
                </button>

                <button className="btn-primary" style={{ backgroundColor: 'var(--color-primary-active)' }}>
                  <span>Primario Hover (Forzado)</span>
                </button>

                <button className="btn-primary btn-sm clay-button-interactive" onClick={() => setClickCount(c => c + 1)}>
                  <span>Primario Pequeño (btn-sm)</span>
                </button>

                <button className="btn-primary" disabled>
                  <span>Primario Deshabilitado</span>
                </button>
              </div>
            </div>

            <div className="ds-component-group">
              <div className="ds-component-title">Botones Secundarios & Enlaces (Canvas #fffaf0)</div>
              <div className="ds-buttons-wrap">
                <button className="btn-secondary clay-button-interactive" onClick={() => setClickCount(c => c + 1)}>
                  <Box size={16} />
                  <span>Secundario Canvas</span>
                </button>

                <button className="btn-secondary btn-sm clay-button-interactive" onClick={() => setClickCount(c => c + 1)}>
                  <span>Secundario Pequeño</span>
                </button>

                <button className="btn-secondary" disabled>
                  <span>Secundario Deshabilitado</span>
                </button>

                <button className="btn-text-link" onClick={() => setClickCount(c => c + 1)}>
                  <span>Botón Enlace de Texto</span>
                  <ChevronRight size={14} />
                </button>

                <a href="#ds" className="text-link" onClick={e => e.preventDefault()}>
                  Hipervínculo inline (.text-link)
                </a>
              </div>
            </div>

            <div className="ds-component-group" style={{ backgroundColor: 'var(--color-brand-teal)', color: '#ffffff' }}>
              <div className="ds-component-title" style={{ color: '#a4d4c5' }}>Botón Sobre Fondo de Color (.btn-on-color)</div>
              <div className="ds-buttons-wrap">
                <button className="btn-on-color clay-button-interactive" onClick={() => setClickCount(c => c + 1)}>
                  <Sparkles size={16} color="var(--color-brand-coral)" />
                  <span>Botón On Color</span>
                </button>

                <button className="btn-on-color btn-sm clay-button-interactive" onClick={() => setClickCount(c => c + 1)}>
                  <span>On Color Pequeño</span>
                </button>

                <button className="btn-on-color" disabled>
                  <span>On Color Deshabilitado</span>
                </button>
              </div>
            </div>
          </section>

          {/* Badges & Category Tabs */}
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <Sparkles size={24} color="var(--color-brand-ochre)" />
                  Badges, Pastillas y Pestañas de Categoría
                </h2>
                <p>Indicadores de estado, tags de wrappers y navegación segmentada.</p>
              </div>
            </div>

            <div className="ds-component-group">
              <div className="ds-component-title">Badges Pill con Paleta Clay</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <span className="badge-pill">Por Defecto</span>
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-brand-coral)', color: '#ffffff', border: 'none' }}>
                  <Flame size={12} />
                  Fuego 2027
                </span>
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-brand-teal)', color: '#ffffff', border: 'none' }}>
                  <Sparkles size={12} />
                  Horizon Teal
                </span>
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-brand-ochre)', color: 'var(--color-ink)', border: 'none' }}>
                  Ocre Dorado
                </span>
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-brand-lavender)', color: 'var(--color-ink)', border: 'none' }}>
                  Lavanda Suave
                </span>
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-brand-mint)', color: 'var(--color-ink)', border: 'none' }}>
                  Menta Fresca
                </span>
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-brand-peach)', color: 'var(--color-ink)', border: 'none' }}>
                  Melocotón
                </span>
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-brand-pink)', color: '#ffffff', border: 'none' }}>
                  Rosa Intenso
                </span>
                <span className="badge-pill" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d', border: '1px solid #22c55e' }}>
                  <CheckCircle2 size={12} />
                  Completado
                </span>
                <span className="badge-pill" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid #f59e0b' }}>
                  <AlertTriangle size={12} />
                  En Progreso
                </span>
              </div>
            </div>

            <div className="ds-component-group">
              <div className="ds-component-title">Category Tabs (Pestañas de Navegación)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="category-tab active">Tab Activo</button>
                <button className="category-tab">Tab Inactivo</button>
                <button className="category-tab">
                  <Box size={14} />
                  <span>Con Ícono</span>
                </button>
                <button className="category-tab">
                  <span>Con Contador</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(0,0,0,0.08)', borderRadius: 10 }}>12</span>
                </button>
              </div>
            </div>
          </section>

          {/* Saturated Feature Cards Grid */}
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <Layers size={24} color="var(--color-brand-pink)" />
                  Tarjetas Temáticas Clay (Feature Cards GEMINI.md)
                </h2>
                <p>Las 8 tarjetas monocolor saturadas con bisel 3D y contraste exacto según el rol de la marca.</p>
              </div>
            </div>

            <div className="ds-cards-grid">
              {/* Pink Card */}
              <div className="feature-card-pink clay-button-interactive">
                <span className="badge-pill" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', border: 'none', marginBottom: 12 }}>
                  .feature-card-pink
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Brand Pink Card
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.95, marginBottom: 16 }}>
                  Tarjeta enérgica para lanzamientos de alto impacto y momentos decisivos.
                </p>
                <button className="btn-on-color btn-sm">Explorar</button>
              </div>

              {/* Teal Card */}
              <div className="feature-card-teal clay-button-interactive">
                <span className="badge-pill" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#a4d4c5', border: 'none', marginBottom: 12 }}>
                  .feature-card-teal
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Brand Teal Card
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.9, marginBottom: 16 }}>
                  Profundidad y sobriedad para checkpoints estratégicos de largo plazo.
                </p>
                <button className="btn-on-color btn-sm">Inspeccionar</button>
              </div>

              {/* Lavender Card */}
              <div className="feature-card-lavender clay-button-interactive">
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', border: 'none', marginBottom: 12 }}>
                  .feature-card-lavender
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Brand Lavender Card
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--color-body)', marginBottom: 16 }}>
                  Especialmente diseñada para bitácoras reflexivas y modelos mentales.
                </p>
                <button className="btn-primary btn-sm">Leer Bitácora</button>
              </div>

              {/* Peach Card */}
              <div className="feature-card-peach clay-button-interactive">
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', border: 'none', marginBottom: 12 }}>
                  .feature-card-peach
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Brand Peach Card
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--color-body)', marginBottom: 16 }}>
                  Calidez y optimismo que inspiran el progreso continuo hacia 2027.
                </p>
                <button className="btn-primary btn-sm">Avanzar</button>
              </div>

              {/* Ochre Card */}
              <div className="feature-card-ochre clay-button-interactive">
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', border: 'none', marginBottom: 12 }}>
                  .feature-card-ochre
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Brand Ochre Card
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--color-body)', marginBottom: 16 }}>
                  Destinada a proyectos de abundancia financiera, maestría y resultados tangibles.
                </p>
                <button className="btn-primary btn-sm">Ver Metas</button>
              </div>

              {/* Mint Card */}
              <div className="feature-card-mint clay-button-interactive">
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', border: 'none', marginBottom: 12 }}>
                  .feature-card-mint
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Brand Mint Card
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--color-body)', marginBottom: 16 }}>
                  Vitalidad y claridad mental para wrappers de salud, hábitos y calma.
                </p>
                <button className="btn-primary btn-sm">Ver Hábitos</button>
              </div>

              {/* Coral Card */}
              <div className="feature-card-coral clay-button-interactive">
                <span className="badge-pill" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', border: 'none', marginBottom: 12 }}>
                  .feature-card-coral
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Brand Coral Card
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: '#ffffff', opacity: 0.95, marginBottom: 16 }}>
                  El estandarte del Año de la Cabra de Fuego. Fuerza, ejecución y pasión.
                </p>
                <button className="btn-on-color btn-sm">Activar 2027</button>
              </div>

              {/* Cream Card */}
              <div className="feature-card-cream clay-button-interactive">
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline)', marginBottom: 12 }}>
                  .feature-card-cream
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Brand Cream Card
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--color-body)', marginBottom: 16 }}>
                  Superficie neutra clásica para lectura relajada y tablas de datos.
                </p>
                <button className="btn-secondary btn-sm">Detalles</button>
              </div>
            </div>
          </section>

          {/* Form Inputs & Interactive Modal Launcher */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Inputs */}
            <section className="ds-section">
              <div className="ds-section-header">
                <div className="ds-section-title-group">
                  <h2>Inputs & Formularios</h2>
                  <p>Campos de texto con relieve inset táctil</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
                    Input de Texto (.input-text)
                  </label>
                  <input type="text" className="input-text" placeholder="Escribe aquí tu meta..." />
                </div>

                <div>
                  <label className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
                    Select Dropdown (.select-custom)
                  </label>
                  <select className="select-custom">
                    <option>Wrapper: Dominio Financiero 2027</option>
                    <option>Wrapper: Salud & Resistencia</option>
                    <option>Wrapper: Filosofía & Bitácora</option>
                  </select>
                </div>

                <div>
                  <label className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
                    Textarea Multilínea (.textarea-custom)
                  </label>
                  <textarea className="textarea-custom" rows={3} placeholder="Describe tus reflexiones..." />
                </div>
              </div>
            </section>

            {/* Modal Demonstration */}
            <section className="ds-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="ds-section-header">
                  <div className="ds-section-title-group">
                    <h2>Modal Táctil Clay</h2>
                    <p>Animación spring con popIn y desenfoque</p>
                  </div>
                </div>

                <p style={{ fontSize: 14, color: 'var(--color-body)', lineHeight: 1.6, marginBottom: 20 }}>
                  Los modales del sistema usan una elevación <code>--shadow-clay-lg</code>, bisel sólido inferior
                  de 12px y un fondo de lienzo cálido con animación reactiva al click.
                </p>
              </div>

              <button
                className="btn-primary clay-button-interactive"
                onClick={() => setIsDemoModalOpen(true)}
                style={{ width: '100%', height: 48 }}
              >
                <ExternalLink size={17} />
                <span>Abrir Demostración de Modal</span>
              </button>
            </section>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 3: ASSETS & GALERÍA DEL HORÓSCOPO CHINO
          ========================================================================= */}
      {activeSubSection === 'assets' && (
        <div className="ds-section-block">
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <Flame size={24} color="var(--color-brand-coral)" />
                  Los 12 Animales del Horóscopo Chino (Chinese Zodiac 3D)
                </h2>
                <p>
                  Esculpidos en arcilla digital táctil con degradados cálidos, ojos vivos y auras lumínicas.
                  Controla en tiempo real su tamaño y efecto de resplandor (glow).
                </p>
              </div>
            </div>

            {/* Gallery Interactive Controls */}
            <div className="ds-gallery-controls">
              <div className="ds-slider-control">
                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 120 }}>
                  Tamaño: <strong>{zodiacSize}px</strong>
                </span>
                <input
                  type="range"
                  min="24"
                  max="160"
                  value={zodiacSize}
                  onChange={e => setZodiacSize(Number(e.target.value))}
                  className="ds-range-slider"
                />
              </div>

              <div
                className="ds-toggle-control"
                onClick={() => setZodiacGlow(g => !g)}
                title="Activar o desactivar aura de luz"
              >
                <div className={`ds-toggle-switch ${zodiacGlow ? 'on' : ''}`}>
                  <div className="ds-toggle-thumb" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Resplandor (Glow): {zodiacGlow ? 'Activado' : 'Desactivado'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-canvas)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-hairline)' }}>
                <Search size={14} color="var(--color-muted)" />
                <input
                  type="text"
                  placeholder="Filtrar por animal..."
                  value={zodiacSearch}
                  onChange={e => setZodiacSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--color-ink)', width: 140 }}
                />
                {zodiacSearch && (
                  <button onClick={() => setZodiacSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* 12 Animals Grid */}
            <div className="ds-zodiac-grid">
              {filteredZodiac.map(animal => (
                <div key={animal.key} className="ds-zodiac-card">
                  <div className="ds-zodiac-chinese-bg">{animal.chineseChar}</div>

                  <div className="ds-zodiac-logo-wrap" style={{ height: Math.max(100, zodiacSize + 20) }}>
                    {renderZodiacLogo(animal.key, zodiacSize, zodiacGlow)}
                  </div>

                  <div className="ds-zodiac-names">
                    <div className="ds-zodiac-name-es">{animal.nameEs}</div>
                    <div className="ds-zodiac-name-en">{animal.nameEn}</div>
                  </div>

                  <div className="ds-zodiac-hanzi-pill">
                    <span>{animal.chineseChar}</span>
                    <span style={{ opacity: 0.6 }}>·</span>
                    <span>{animal.pinyin}</span>
                    {animal.key === 'goat' && (
                      <span style={{ color: 'var(--color-brand-coral)', fontWeight: 800 }}>★ 2027</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Clay 3D Illustrations Showcase */}
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <Sparkles size={24} color="var(--color-brand-teal)" />
                  Ilustraciones Oficiales Clay (ClayIllustration.tsx)
                </h2>
                <p>Obras SVG vectoriales con luz cenital, nubes flotantes y profundidad de arcilla.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['mountain', 'hourglass', 'mascot', 'stack'] as const).map(t => (
                    <button
                      key={t}
                      className={`category-tab ${illustrationType === t ? 'active' : ''}`}
                      onClick={() => setIllustrationType(t)}
                    >
                      {t === 'mountain' && 'Cumbre 2027'}
                      {t === 'hourglass' && 'Reloj de Arena'}
                      {t === 'mascot' && 'Mascota Blob'}
                      {t === 'stack' && 'Capas Clay'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="ds-illustration-stage"
              style={{
                backgroundColor:
                  illustrationBackdrop === 'canvas'
                    ? 'var(--color-canvas)'
                    : illustrationBackdrop === 'soft'
                    ? 'var(--color-surface-soft)'
                    : illustrationBackdrop === 'card'
                    ? 'var(--color-surface-card)'
                    : 'var(--color-surface-dark)',
              }}
            >
              <div className="ds-backdrop-selector">
                <span style={{ fontSize: 12, fontWeight: 700, marginRight: 8, alignSelf: 'center', color: illustrationBackdrop === 'dark' ? '#ffffff' : 'var(--color-ink)' }}>
                  Fondo de Prueba:
                </span>
                <div
                  className={`ds-backdrop-dot ${illustrationBackdrop === 'soft' ? 'selected' : ''}`}
                  style={{ backgroundColor: 'var(--color-surface-soft)' }}
                  onClick={() => setIllustrationBackdrop('soft')}
                  title="Superficie Suave"
                />
                <div
                  className={`ds-backdrop-dot ${illustrationBackdrop === 'canvas' ? 'selected' : ''}`}
                  style={{ backgroundColor: 'var(--color-canvas)' }}
                  onClick={() => setIllustrationBackdrop('canvas')}
                  title="Canvas Marfil"
                />
                <div
                  className={`ds-backdrop-dot ${illustrationBackdrop === 'card' ? 'selected' : ''}`}
                  style={{ backgroundColor: 'var(--color-surface-card)' }}
                  onClick={() => setIllustrationBackdrop('card')}
                  title="Surface Card"
                />
                <div
                  className={`ds-backdrop-dot ${illustrationBackdrop === 'dark' ? 'selected' : ''}`}
                  style={{ backgroundColor: 'var(--color-surface-dark)' }}
                  onClick={() => setIllustrationBackdrop('dark')}
                  title="Surface Dark"
                />
              </div>

              <ClayIllustration type={illustrationType} size={illustrationSize} />

              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: illustrationBackdrop === 'dark' ? '#ffffff' : 'var(--color-muted)' }}>
                  Escala: {illustrationSize}px
                </span>
                <input
                  type="range"
                  min="120"
                  max="320"
                  value={illustrationSize}
                  onChange={e => setIllustrationSize(Number(e.target.value))}
                  className="ds-range-slider"
                  style={{ width: 160 }}
                />
              </div>
            </div>
          </section>

          {/* Monolith Brand Logos */}
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>Isotipos Oficiales de Horizon 2027</h2>
                <p>Variantes del emblema principal para cabeceras y favicons.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              <div className="ds-zodiac-card" style={{ padding: 24 }}>
                <HorizonGoatLogo size={64} withGlow={true} />
                <strong style={{ marginTop: 14, fontSize: 16 }}>HorizonGoatLogo</strong>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Mascota oficial y avatar de cuenta</span>
              </div>

              <div className="ds-zodiac-card" style={{ padding: 24 }}>
                <Clay2027Logo size={64} withGlow={true} />
                <strong style={{ marginTop: 14, fontSize: 16 }}>Clay2027Logo</strong>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Isotipo central de la cabecera</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 4: SANDBOX / PLAYGROUND INTERACTIVO
          ========================================================================= */}
      {activeSubSection === 'playground' && (
        <div className="ds-section-block">
          <section className="ds-section">
            <div className="ds-section-header">
              <div className="ds-section-title-group">
                <h2>
                  <SlidersHorizontal size={24} color="var(--color-brand-coral)" />
                  Compositor de Tarjetas Clay en Vivo (Interactive Sandbox)
                </h2>
                <p>
                  Diseña componentes táctiles al instante combinando paletas, mascotas y botones.
                  El código React/TSX generado está optimizado y listo para ser pegado en tu proyecto.
                </p>
              </div>
            </div>

            <div className="ds-playground-layout">
              {/* Controls Column */}
              <div className="ds-composer-form">
                <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--color-hairline)', paddingBottom: 10 }}>
                  Configuración del Componente
                </h3>

                {/* Color Selector */}
                <div className="ds-field-group">
                  <label className="ds-field-label">Color de Arcilla (Feature Card)</label>
                  <div className="ds-color-picker-chips">
                    {(['coral', 'pink', 'teal', 'lavender', 'peach', 'ochre', 'mint', 'cream'] as const).map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`ds-color-chip ${pgColor === color ? 'selected' : ''}`}
                        onClick={() => setPgColor(color)}
                        style={{
                          backgroundColor:
                            color === 'pink' ? 'var(--color-brand-pink)' :
                            color === 'teal' ? 'var(--color-brand-teal)' :
                            color === 'lavender' ? 'var(--color-brand-lavender)' :
                            color === 'peach' ? 'var(--color-brand-peach)' :
                            color === 'ochre' ? 'var(--color-brand-ochre)' :
                            color === 'mint' ? 'var(--color-brand-mint)' :
                            color === 'coral' ? 'var(--color-brand-coral)' :
                            'var(--color-surface-card)',
                          color: (color === 'pink' || color === 'teal' || color === 'coral') ? '#ffffff' : '#0a0a0a',
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mascot Animal Selector */}
                <div className="ds-field-group">
                  <label className="ds-field-label">Mascota del Horóscopo Chino</label>
                  <select
                    className="select-custom"
                    value={pgAnimal}
                    onChange={e => setPgAnimal(e.target.value as ChineseZodiacSign)}
                  >
                    {CHINESE_ZODIAC_ANIMALS.map(a => (
                      <option key={a.key} value={a.key}>
                        {a.nameEs} ({a.chineseChar} - {a.pinyin})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Badge Text */}
                <div className="ds-field-group">
                  <label className="ds-field-label">Texto del Badge Pill</label>
                  <input
                    type="text"
                    className="input-text"
                    value={pgBadge}
                    onChange={e => setPgBadge(e.target.value)}
                  />
                </div>

                {/* Title */}
                <div className="ds-field-group">
                  <label className="ds-field-label">Título Principal</label>
                  <input
                    type="text"
                    className="input-text"
                    value={pgTitle}
                    onChange={e => setPgTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="ds-field-group">
                  <label className="ds-field-label">Descripción / Contenido</label>
                  <textarea
                    className="textarea-custom"
                    rows={2}
                    value={pgDesc}
                    onChange={e => setPgDesc(e.target.value)}
                  />
                </div>

                {/* Button Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="ds-field-group">
                    <label className="ds-field-label">Tipo de Botón Principal</label>
                    <select
                      className="select-custom"
                      value={pgBtnType}
                      onChange={e => setPgBtnType(e.target.value as any)}
                    >
                      <option value="primary">Primario (.btn-primary)</option>
                      <option value="secondary">Secundario (.btn-secondary)</option>
                      <option value="on-color">Sobre Color (.btn-on-color)</option>
                    </select>
                  </div>

                  <div className="ds-field-group">
                    <label className="ds-field-label">Texto del Botón</label>
                    <input
                      type="text"
                      className="input-text"
                      value={pgBtnLabel}
                      onChange={e => setPgBtnLabel(e.target.value)}
                    />
                  </div>
                </div>

                {/* Secondary Button Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={pgShowSecondaryBtn}
                      onChange={e => setPgShowSecondaryBtn(e.target.checked)}
                      style={{ accentColor: 'var(--color-brand-coral)', width: 16, height: 16 }}
                    />
                    <span>Incluir botón secundario</span>
                  </label>
                  {pgShowSecondaryBtn && (
                    <input
                      type="text"
                      className="input-text"
                      style={{ height: 34, fontSize: 13, flex: 1 }}
                      value={pgSecondaryLabel}
                      onChange={e => setPgSecondaryLabel(e.target.value)}
                      placeholder="Texto botón secundario"
                    />
                  )}
                </div>
              </div>

              {/* Preview & Code Column */}
              <div className="ds-preview-container">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="caption-uppercase" style={{ fontWeight: 800, color: 'var(--color-brand-coral)' }}>
                      Vista Previa Táctil en Vivo
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Interactúa con los botones</span>
                  </div>

                  <div className="ds-preview-canvas">
                    <div
                      className={`feature-card-${pgColor} clay-button-interactive`}
                      style={{ width: '100%', maxWidth: 440, position: 'relative', overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span className="badge-pill" style={{ backgroundColor: 'var(--color-surface-card)', fontWeight: 700 }}>
                          {pgBadge}
                        </span>
                        {renderZodiacLogo(pgAnimal, 52, true)}
                      </div>

                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>
                        {pgTitle}
                      </h3>

                      <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.92, marginBottom: 20 }}>
                        {pgDesc}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <button
                          className={`${pgBtnType === 'primary' ? 'btn-primary' : pgBtnType === 'secondary' ? 'btn-secondary' : 'btn-on-color'} clay-button-interactive`}
                          onClick={() => copyToClipboard(pgTitle, 'Título')}
                        >
                          {pgBtnLabel}
                        </button>
                        {pgShowSecondaryBtn && (
                          <button className="btn-secondary clay-button-interactive">
                            {pgSecondaryLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* React Code Generator */}
                <div className="ds-code-output">
                  <div className="ds-code-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Code2 size={16} color="#a4d4c5" />
                      <span className="ds-code-title">CustomClayCard.tsx</span>
                    </div>

                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => copyToClipboard(generatedReactCode, 'Código React')}
                      style={{
                        padding: '4px 10px',
                        height: 28,
                        fontSize: 12,
                        backgroundColor: '#1a3a3a',
                        color: '#ffffff',
                        border: '1px solid #2a4a4a',
                      }}
                    >
                      <Copy size={13} />
                      <span>Copiar Código</span>
                    </button>
                  </div>

                  <pre className="ds-code-pre">
                    <code>{generatedReactCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* --- INTERACTIVE CLAY MODAL PREVIEW --- */}
      {isDemoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDemoModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FireGoatLogo size={42} withGlow={true} />
                <div>
                  <span className="badge-pill" style={{ backgroundColor: 'var(--color-brand-coral)', color: '#ffffff', border: 'none', fontSize: 11 }}>
                    ✦ MODAL CLAY TÁCTIL
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                    Arquitectura de Capa de Presentación
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                style={{
                  background: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-pill)',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-ink)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-body)', marginBottom: 20 }}>
              Este modal implementa el contenedor <code>.modal-content</code> con bisel inferior extruido
              de 12px, curvatura <code>--radius-xl (24px)</code> y animación <code>popIn</code> con curva cúbica
              elástica <code>cubic-bezier(0.34, 1.56, 0.64, 1)</code>.
            </p>

            <div className="feature-card-cream" style={{ marginBottom: 24, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <CheckCircle2 size={16} color="var(--color-brand-teal)" />
                <strong style={{ fontSize: 14 }}>Tokens Aplicados Correctamente</strong>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
                Todos los colores, espaciados y tipografías provienen de las variables CSS declaradas en <code>theme.css</code> y <code>design-system.css</code>.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn-secondary clay-button-interactive" onClick={() => setIsDemoModalOpen(false)}>
                Cerrar Demostración
              </button>
              <button
                className="btn-primary clay-button-interactive"
                onClick={() => {
                  copyToClipboard('<div className="modal-overlay"><div className="modal-content">...</div></div>', 'Snippet Modal');
                  setIsDemoModalOpen(false);
                }}
              >
                <Copy size={15} />
                <span>Copiar Clases del Modal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING TOAST NOTIFICATION --- */}
      {copiedNotification && (
        <div className="ds-toast">
          <Check size={16} color="var(--color-success)" />
          <span>{copiedNotification}</span>
        </div>
      )}
    </div>
  );
};
