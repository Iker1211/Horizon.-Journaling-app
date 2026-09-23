import React, { useState, useEffect } from "react";
import { CountdownTime } from "../utils/dates";
import { Sparkles, User, ChevronDown, ChevronUp } from "lucide-react";

interface HumanLifespanHeroProps {
  countdown: CountdownTime;
}

const AVERAGE_LIFESPAN_YEARS = 80;
const AVERAGE_LIFESPAN_DAYS = Math.round(AVERAGE_LIFESPAN_YEARS * 365.25); // ~29,220 days
const AVERAGE_LIFESPAN_WEEKS = Math.round(AVERAGE_LIFESPAN_DAYS / 7); // ~4,174 weeks (~4,000)

export const HumanLifespanHero: React.FC<HumanLifespanHeroProps> = ({ countdown }) => {
  const [userAge, setUserAge] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("clay_2027_user_age");
      return saved ? Math.max(1, Math.min(100, parseInt(saved, 10))) : 25;
    } catch {
      return 25;
    }
  });

  const [isEditingAge, setIsEditingAge] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("clay_2027_lifespan_collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("clay_2027_user_age", userAge.toString());
    } catch (e) {
      console.warn("Could not save user age to localStorage:", e);
    }
  }, [userAge]);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem("clay_2027_lifespan_collapsed", String(next));
    } catch (e) {
      console.warn("Could not save collapsed state:", e);
    }
  };

  // Calculations
  const daysLived = Math.round(userAge * 365.25);
  const weeksLived = Math.round(daysLived / 7);
  const percentageLived = Math.min(100, Math.max(0, (userAge / AVERAGE_LIFESPAN_YEARS) * 100));

  const yearsRemaining = Math.max(0, AVERAGE_LIFESPAN_YEARS - userAge);
  const daysRemaining = Math.round(yearsRemaining * 365.25);
  const weeksRemaining = Math.round(daysRemaining / 7);

  const handleAgeChange = (newAge: number) => {
    const clamped = Math.max(1, Math.min(95, newAge));
    setUserAge(clamped);
  };

  return (
    <div className="existential-hud-card" role="region" aria-label="Marco Existencial de Vida">
      {/* Top Header: Tag + Age Customizer + Toggle */}
      <div className="existential-hud-header">
        <div className="existential-hud-title-group">
          <span
            className="badge-pill"
            style={{
              backgroundColor: "var(--color-brand-teal)",
              color: "var(--color-on-dark)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.5px",
              padding: "4px 12px",
            }}
          >
            ✦ NIVEL SUPREMO · MARCO EXISTENCIAL
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
            La Vida Humana en Perspectiva
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* User Age Selector */}
          <div className="existential-age-pill">
            <User size={14} color="var(--color-brand-coral)" />
            <span style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600 }}>Tu edad:</span>
            {isEditingAge ? (
              <input
                type="number"
                min={1}
                max={95}
                value={userAge}
                onChange={e => handleAgeChange(parseInt(e.target.value, 10) || userAge)}
                onBlur={() => setIsEditingAge(false)}
                autoFocus
                className="existential-age-input"
                aria-label="Ingresa tu edad"
              />
            ) : (
              <span
                onClick={() => setIsEditingAge(true)}
                style={{
                  fontWeight: 800,
                  fontSize: 14,
                  color: "var(--color-ink)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
                title="Haz clic para cambiar tu edad"
              >
                {userAge} años
              </span>
            )}

            <div style={{ display: "flex", gap: 2 }}>
              <button
                type="button"
                className="existential-age-btn"
                onClick={() => handleAgeChange(userAge - 1)}
                title="Disminuir edad"
                aria-label="Disminuir edad"
              >
                -
              </button>
              <button
                type="button"
                className="existential-age-btn"
                onClick={() => handleAgeChange(userAge + 1)}
                title="Aumentar edad"
                aria-label="Aumentar edad"
              >
                +
              </button>
            </div>
          </div>

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="btn-secondary btn-sm clay-button-interactive"
            style={{ padding: "4px 10px", fontSize: 11, height: 28, gap: 4 }}
            title={isCollapsed ? "Expandir perspectiva existencial" : "Minimizar perspectiva existencial"}
          >
            {isCollapsed ? (
              <>
                <ChevronDown size={13} />
                <span>Ver HUD</span>
              </>
            ) : (
              <>
                <ChevronUp size={13} />
                <span>Compactar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsed summary pill */}
      {isCollapsed ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
          <span style={{ fontSize: 13, color: "var(--color-body)" }}>
            Has vivido <strong>{weeksLived.toLocaleString()} semanas</strong> ({percentageLived.toFixed(1)}%). Restan ~{weeksRemaining.toLocaleString()} semanas.
          </span>
          <span style={{ fontSize: 12, color: "var(--color-ink)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={13} color="var(--color-brand-ochre)" />
            <span>2027: a D-{countdown.days} días</span>
          </span>
        </div>
      ) : (
        <>
          {/* Triad of Existential Metrics */}
          <div className="existential-metrics-grid">
            <div className="existential-metric-card">
              <div className="existential-metric-label">
                Edad Promedio Humana
              </div>
              <div className="existential-metric-val">
                {AVERAGE_LIFESPAN_YEARS} Años
              </div>
              <div className="existential-metric-sub">
                ~{AVERAGE_LIFESPAN_DAYS.toLocaleString()} días (~{AVERAGE_LIFESPAN_WEEKS.toLocaleString()} semanas)
              </div>
            </div>

            <div className="existential-metric-card">
              <div className="existential-metric-label" style={{ color: "var(--color-brand-teal)" }}>
                Tiempo Transcurrido ({percentageLived.toFixed(1)}%)
              </div>
              <div className="existential-metric-val">
                {weeksLived.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600 }}>semanas</span>
              </div>
              <div className="existential-metric-sub">
                ~{daysLived.toLocaleString()} días vividos hasta hoy
              </div>
            </div>

            <div className="existential-metric-card" style={{ borderTop: "3px solid var(--color-brand-coral)" }}>
              <div className="existential-metric-label" style={{ color: "var(--color-brand-teal)" }}>
                Horizonte por Conquistar
              </div>
              <div className="existential-metric-val">
                {weeksRemaining.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>semanas</span>
              </div>
              <div className="existential-metric-sub">
                ~{daysRemaining.toLocaleString()} días restantes estimados
              </div>
            </div>
          </div>

          {/* Tactile Life-Progress Bar */}
          <div style={{ marginTop: 14, marginBottom: 8 }}>
            <div className="existential-footer-legend">
              <span style={{ color: "var(--color-body)" }}>0 años (Nacimiento)</span>
              <span style={{ color: "var(--color-ink)", display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                <Sparkles size={12} color="var(--color-brand-ochre)" />
                <span>Pivote 2027: D-{countdown.days} días</span>
              </span>
              <span style={{ color: "var(--color-body)" }}>{AVERAGE_LIFESPAN_YEARS} años (Esperanza media)</span>
            </div>

            <div className="existential-progress-track" style={{ height: 16, marginTop: 6 }}>
              {/* Lived Segment */}
              <div
                className="existential-progress-fill"
                style={{
                  width: `${percentageLived}%`,
                }}
              />

              {/* 2027 Strategic Indicator */}
              <div
                className="existential-progress-marker"
                style={{
                  left: `${Math.max(1, percentageLived - 0.5)}%`,
                  width: 6,
                  borderRadius: "var(--radius-xs)",
                }}
              />
            </div>
          </div>

          {/* Philosophical Insight */}
          <div className="existential-quote-box">
            💡 En la escala de los ~29,200 días de una vida humana promedio, el <strong>2027</strong> representa una ventana de aceleración decisiva. Cada Wrapper que estructures y cada entrada de bitácora que escribas orienta el rumbo de tu tiempo total.
          </div>
        </>
      )}
    </div>
  );
};
