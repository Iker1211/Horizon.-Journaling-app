import React, { useState } from 'react';
import { BigTheme, BlogEntry } from '../types';
import { CountdownTime, getTodayDateString, formatDateSpanish } from '../utils/dates';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CalendarDays,
  Edit2,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { ClayIllustration } from './ClayIllustration';
import {
  getAppStartDate,
  saveAppStartDate,
  calculate365Cycle,
  getQuarterForDate,
  QuarterId,
} from '../utils/quarters';

interface CalendarCountdownProps {
  countdown?: CountdownTime;
  themes: BigTheme[];
  blogEntries: BlogEntry[];
  onSelectDate: (dateStr: string) => void;
  onWriteEntryForDate?: (dateStr: string) => void;
  onSelectBlogEntry?: (entry: BlogEntry) => void;
}

export const CalendarCountdown: React.FC<CalendarCountdownProps> = ({
  countdown: _countdown,
  themes,
  blogEntries,
  onSelectDate,
  onWriteEntryForDate,
  onSelectBlogEntry,
}) => {
  const todayStr = getTodayDateString();
  const todayParts = todayStr.split('-');
  const [currentYear, setCurrentYear] = useState<number>(parseInt(todayParts[0], 10));
  const [currentMonth, setCurrentMonth] = useState<number>(parseInt(todayParts[1], 10) - 1); // 0-indexed

  // Start Date for the 365-day year cycle
  const [startDateStr, setStartDateStr] = useState<string>(() => getAppStartDate());
  const [isEditingStartDate, setIsEditingStartDate] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDateStr);

  // 365-Day Cycle and Quarters calculation
  const cycle365 = calculate365Cycle(startDateStr, todayStr);

  // Quarter Filter for Reflections
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<'all' | QuarterId>('all');

  // Custom date calculator state
  const [customCalcDate, setCustomCalcDate] = useState<string>('2027-01-01');
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(todayStr);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleSaveStartDate = () => {
    if (tempStartDate && /^\d{4}-\d{2}-\d{2}$/.test(tempStartDate)) {
      saveAppStartDate(tempStartDate);
      setStartDateStr(tempStartDate);
      setIsEditingStartDate(false);
    }
  };

  const handleCancelEditStartDate = () => {
    setTempStartDate(startDateStr);
    setIsEditingStartDate(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleJumpToStartDate = () => {
    const parts = startDateStr.split('-');
    setCurrentYear(parseInt(parts[0], 10));
    setCurrentMonth(parseInt(parts[1], 10) - 1);
  };

  const handleJumpTo2027 = () => {
    setCurrentYear(2027);
    setCurrentMonth(0); // Enero 2027
  };

  const handleJumpToToday = () => {
    setCurrentYear(parseInt(todayParts[0], 10));
    setCurrentMonth(parseInt(todayParts[1], 10) - 1);
  };

  const handleJumpToQuarter = (qStartDate: string) => {
    const parts = qStartDate.split('-');
    setCurrentYear(parseInt(parts[0], 10));
    setCurrentMonth(parseInt(parts[1], 10) - 1);
  };

  // Calculate days matrix for Month Calendar
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const startDayOffset = (firstDayOfMonth + 6) % 7;
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    is2027Target: boolean;
    daysTo2027: number;
    quarterInfo: ReturnType<typeof getQuarterForDate>;
  }> = [];

  // Previous month padding
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const diff = Math.floor((new Date('2027-01-01T00:00:00').getTime() - new Date(`${dateStr}T00:00:00`).getTime()) / (1000 * 3600 * 24));
    calendarDays.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      is2027Target: dateStr === '2027-01-01',
      daysTo2027: diff,
      quarterInfo: getQuarterForDate(dateStr, startDateStr),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const m = currentMonth + 1;
    const dateStr = `${currentYear}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const diff = Math.floor((new Date('2027-01-01T00:00:00').getTime() - new Date(`${dateStr}T00:00:00`).getTime()) / (1000 * 3600 * 24));
    calendarDays.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      is2027Target: dateStr === '2027-01-01',
      daysTo2027: diff,
      quarterInfo: getQuarterForDate(dateStr, startDateStr),
    });
  }

  // Next month padding
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const diff = Math.floor((new Date('2027-01-01T00:00:00').getTime() - new Date(`${dateStr}T00:00:00`).getTime()) / (1000 * 3600 * 24));
    calendarDays.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      is2027Target: dateStr === '2027-01-01',
      daysTo2027: diff,
      quarterInfo: getQuarterForDate(dateStr, startDateStr),
    });
  }

  // Custom date subtraction calculation
  const getCustomDiffDays = () => {
    try {
      const today = new Date(todayStr).getTime();
      const target = new Date(customCalcDate).getTime();
      return Math.round((target - today) / (1000 * 3600 * 24));
    } catch {
      return 0;
    }
  };

  const customDaysLeft = getCustomDiffDays();
  const customQuarterInfo = getQuarterForDate(customCalcDate, startDateStr);

  // Filtered Reflections based on Quarter tab
  const filteredBlogs = blogEntries.filter(b => {
    if (selectedQuarterFilter === 'all') return true;
    const qInfo = getQuarterForDate(b.date, startDateStr);
    return qInfo.quarterId === selectedQuarterFilter;
  });

  const selectedDayQuarterInfo = selectedDayDetail
    ? getQuarterForDate(selectedDayDetail, startDateStr)
    : null;

  return (
    <div className="calendar-page-container">
      {/* 365-Day Hero Banner & 4 Quarters Timeline */}
      <section className="subtractor-hero">
        <div>
          <span className="subtractor-tagline">
            ✦ Calendario Anual de 365 Días — Los 4 Quarters de Ejecución
          </span>
          <h1 className="subtractor-main-title">
            Tu año de 365 días: los 4 Quarters de Conquista.
          </h1>
          <p className="body-sm" style={{ color: 'var(--color-on-dark-soft)', marginBottom: 14 }}>
            Estructurado en cuatro cuartos (Q1, Q2, Q3, Q4) desde el día en que comenzaste a utilizar la aplicación.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Grand Day Badge */}
            <div className="subtractor-counter-badge">
              <span className="subtractor-big-num">
                Día {cycle365.currentDayNumber}
              </span>
              <span className="subtractor-big-label">
                de 365 del año
              </span>
            </div>

            {/* Current Quarter Pill */}
            <div
              className="badge-pill"
              style={{
                backgroundColor: 'rgba(255, 107, 90, 0.14)',
                border: '1px solid rgba(255, 107, 90, 0.35)',
                color: 'var(--color-ink)',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ✦ {cycle365.currentQuarter.name} en curso · Día {cycle365.currentQuarter.daysElapsed} de {cycle365.currentQuarter.totalDays}
            </div>

            {/* Days remaining badge */}
            <div
              className="badge-pill"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-ink)',
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Restan {cycle365.currentQuarter.daysRemaining} días para terminar {cycle365.currentQuarter.name}
            </div>
          </div>

          {/* Linear 4-Quarter Segmented Progress Track */}
          <div className="quarters-timeline-wrapper">
            <div className="quarters-timeline-header">
              <span>Progreso Global del Año (365 días)</span>
              <span><strong>{cycle365.progressPercent}%</strong> transcurrido</span>
            </div>

            <div className="quarters-timeline-track">
              {cycle365.quarters.map(q => (
                <div
                  key={q.id}
                  className={`quarters-timeline-segment ${q.status === 'active' ? 'active' : ''}`}
                  onClick={() => setSelectedQuarterFilter(q.id)}
                  title={`${q.title} (${q.totalDays} días): ${q.progressPercent}% completado`}
                >
                  <div
                    className={`quarters-timeline-segment-fill ${q.id.toLowerCase()}`}
                    style={{ width: `${q.progressPercent}%` }}
                  />
                  <span className="quarters-timeline-segment-label">
                    {q.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="quarters-timeline-legend">
              <span>Inicio: {formatDateSpanish(cycle365.startDateStr)}</span>
              <span>Q1 (91d) · Q2 (91d) · Q3 (91d) · Q4 (92d)</span>
              <span>Cierre 365: {formatDateSpanish(cycle365.endDateStr)}</span>
            </div>
          </div>

          {/* Start Date Management Strip */}
          <div className="calendar-start-date-strip">
            <div className="calendar-start-date-info">
              <CalendarDays size={17} color="var(--color-brand-peach)" />
              <span>
                Ciclo iniciado el <strong>{formatDateSpanish(startDateStr)}</strong>. Culmina el <strong>{formatDateSpanish(cycle365.endDateStr)}</strong>.
              </span>
            </div>

            <div className="calendar-start-date-actions">
              {isEditingStartDate ? (
                <div className="start-date-edit-inline">
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={e => setTempStartDate(e.target.value)}
                    className="input-text"
                    style={{
                      height: 30,
                      padding: '2px 8px',
                      fontSize: 12,
                      background: 'var(--color-canvas)',
                      color: 'var(--color-ink)',
                    }}
                  />
                  <button
                    className="btn-primary btn-sm"
                    onClick={handleSaveStartDate}
                    style={{ height: 30, padding: '0 8px' }}
                    title="Confirmar nueva fecha de inicio"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={handleCancelEditStartDate}
                    style={{ height: 30, padding: '0 8px' }}
                    title="Cancelar"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setIsEditingStartDate(true)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-on-dark)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: 12,
                    gap: 6,
                  }}
                >
                  <Edit2 size={13} />
                  <span>Ajustar fecha de inicio</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="subtractor-hero-art">
          <ClayIllustration type="hourglass" size={190} />
        </div>
      </section>

      {/* Los 4 Quarters del Año (Executive Cards Grid) */}
      <section className="quarters-section">
        <div className="section-header">
          <div>
            <span className="caption-uppercase" style={{ color: 'var(--color-brand-coral)' }}>
              Estructura CEO · 4 Cuartos Estratégicos
            </span>
            <h2 className="section-title">Los 4 Quarters del Año (Q1, Q2, Q3, Q4)</h2>
            <p className="section-desc">
              Cada cuarto representa una fase de 91 a 92 días con foco ejecutivo y bitácora continua.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn-sm ${selectedQuarterFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedQuarterFilter('all')}
            >
              Ver Todos los Quarters
            </button>
          </div>
        </div>

        <div className="quarters-cards-grid">
          {cycle365.quarters.map(q => {
            const isFilterActive = selectedQuarterFilter === q.id;
            const qBlogs = blogEntries.filter(b => {
              const qInfo = getQuarterForDate(b.date, startDateStr);
              return qInfo.quarterId === q.id;
            });

            return (
              <div
                key={q.id}
                className={`quarter-card ${q.status === 'active' ? 'active' : ''}`}
                style={{
                  borderColor: isFilterActive ? 'var(--color-brand-coral)' : undefined,
                  boxShadow: isFilterActive ? '0 8px 0 var(--color-brand-coral)' : undefined,
                }}
                onClick={() => {
                  setSelectedQuarterFilter(isFilterActive ? 'all' : q.id);
                  handleJumpToQuarter(q.startDateStr);
                }}
              >
                <div>
                  <div className="quarter-card-top">
                    <span className="quarter-id-badge" style={{ color: `var(--color-brand-${q.color})` }}>
                      {q.name}
                    </span>
                    <span className={`quarter-status-pill ${q.status}`}>
                      {q.status === 'active' ? '● En Curso' : q.status === 'completed' ? '✓ Completado' : 'Próximo'}
                    </span>
                  </div>

                  <h3 className="quarter-title">{q.title}</h3>
                  <div className="quarter-subtitle">{q.subtitle}</div>

                  <div className="quarter-daterange">
                    {formatDateSpanish(q.startDateStr)} ➔ {formatDateSpanish(q.endDateStr)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, fontWeight: 600 }}>
                    Días {q.startDayNumber} a {q.endDayNumber} ({q.totalDays} días)
                  </div>
                </div>

                <div>
                  {/* Progress in this Quarter */}
                  <div className="quarter-progress-wrapper">
                    <div className="quarter-progress-label">
                      <span>Progreso del cuarto</span>
                      <span><strong>{q.progressPercent}%</strong> ({q.daysElapsed}/{q.totalDays}d)</span>
                    </div>
                    <div className="quarter-progress-bar">
                      <div
                        className="quarter-progress-fill"
                        style={{
                          width: `${q.progressPercent}%`,
                          backgroundColor: `var(--color-brand-${q.color})`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="quarter-metrics-row">
                    <div className="quarter-metric-box">
                      <div className="quarter-metric-num">
                        {q.totalDays}d
                      </div>
                      <div className="quarter-metric-lbl">Duración</div>
                    </div>
                    <div className="quarter-metric-box">
                      <div className="quarter-metric-num">
                        {qBlogs.length}
                      </div>
                      <div className="quarter-metric-lbl">Bitácoras</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic Calculator Tool: Calculadora de Días & Cuartos */}
      <section className="subtractor-calc-tool">
        <div className="subtractor-calc-header">
          <Clock size={20} color="var(--color-brand-coral)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-ink)' }}>
              Calculadora de Días & Fechas Clave
            </h4>
            <p className="body-sm" style={{ fontSize: 13 }}>
              Calcula los días exactos que restan desde hoy ({todayStr}) hasta cualquier fecha clave en tu año de 365 días.
            </p>
          </div>
        </div>

        <div className="subtractor-calc-inputs">
          <input
            type="date"
            className="input-text subtractor-date-input"
            value={customCalcDate}
            onChange={e => setCustomCalcDate(e.target.value)}
          />
          <div
            className="badge-pill subtractor-calc-result"
            style={{
              backgroundColor: customDaysLeft >= 0 ? 'var(--color-primary)' : 'var(--color-error)',
              color: 'var(--color-on-primary)',
            }}
          >
            {customDaysLeft >= 0 ? `Restan ${customDaysLeft} días` : `Pasaron ${Math.abs(customDaysLeft)} días`}
            {customQuarterInfo.isWithinYear && ` · ${customQuarterInfo.statusLabel}`}
          </div>
        </div>
      </section>

      {/* Calendar Controls & Navigation Bar */}
      <div className="calendar-controls-bar">
        <div className="calendar-month-selector">
          <button className="btn-secondary btn-sm" onClick={handlePrevMonth} title="Mes anterior">
            <ChevronLeft size={16} />
          </button>
          <h3 className="calendar-month-title">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button className="btn-secondary btn-sm" onClick={handleNextMonth} title="Mes siguiente">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="calendar-quick-actions">
          <button className="btn-secondary btn-sm" onClick={handleJumpToToday}>
            Hoy
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={handleJumpToStartDate}
            title={`Ir a la fecha de inicio del año (${startDateStr})`}
          >
            Inicio Año
          </button>
          <button
            className="btn-primary btn-sm clay-button-interactive"
            onClick={handleJumpTo2027}
            style={{ backgroundColor: 'var(--color-brand-teal)' }}
          >
            <span className="desktop-only-text">★ Saltar al 2027</span>
            <span className="mobile-only-text">★ 2027</span>
          </button>
          {onWriteEntryForDate && (
            <button
              className="btn-primary btn-sm clay-button-interactive"
              onClick={() => onWriteEntryForDate(todayStr)}
            >
              <Plus size={14} /> <span>Escribir</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Month Matrix */}
      <div className="calendar-grid-card">
        <div className="calendar-weekdays-header">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
          <div>Dom</div>
        </div>

        <div className="calendar-days-matrix">
          {calendarDays.map((dayItem, idx) => {
            const dayBlogs = blogEntries.filter(b => b.date === dayItem.dateStr);
            const hasBlog = dayBlogs.length > 0;
            const isSelected = selectedDayDetail === dayItem.dateStr;
            const q = dayItem.quarterInfo;

            let deltaLabel = '';
            if (dayItem.daysTo2027 > 0) {
              deltaLabel = `-${dayItem.daysTo2027}d`;
            } else if (dayItem.daysTo2027 === 0) {
              deltaLabel = '★ 2027';
            } else {
              deltaLabel = `+${Math.abs(dayItem.daysTo2027)}d`;
            }

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${!dayItem.isCurrentMonth ? 'other-month' : ''} ${dayItem.isToday ? 'today' : ''} ${dayItem.is2027Target ? 'target-2027' : ''}`}
                style={{
                  border: isSelected ? '2px solid var(--color-brand-coral)' : undefined,
                }}
                onClick={() => {
                  setSelectedDayDetail(dayItem.dateStr);
                  onSelectDate(dayItem.dateStr);
                }}
              >
                <div className="calendar-day-top">
                  <span className="calendar-day-num">{dayItem.dayNum}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {q.quarterId && (
                      <span className={`day-quarter-tag ${q.quarterId.toLowerCase()}`} title={`Día ${q.dayNumberInYear} de 365 (${q.quarterName})`}>
                        {q.quarterName}
                      </span>
                    )}
                    <span className="calendar-day-delta">{dayItem.isToday ? 'HOY' : deltaLabel}</span>
                  </div>
                </div>

                <div className="calendar-day-badges">
                  {hasBlog && (
                    <>
                      <div
                        className="day-blog-tag desktop-tag"
                        title={dayBlogs[0].title}
                        style={{ backgroundColor: 'var(--color-surface-soft)', color: 'var(--color-ink)' }}
                      >
                        {dayBlogs[0].title}
                      </div>
                      <div
                        className="day-badge-dot mobile-tag"
                        style={{ backgroundColor: 'var(--color-brand-peach)' }}
                        title={`Bitácora: ${dayBlogs[0].title}`}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector */}
      {selectedDayDetail && (
        <section className="calendar-inspector-card">
          <div className="inspector-header">
            <div>
              <span className="caption-uppercase" style={{ color: 'var(--color-brand-coral)' }}>
                Detalle del Día Seleccionado
              </span>
              <h3 className="title-md inspector-date-title" style={{ fontFamily: 'var(--font-display)', marginTop: 2 }}>
                {formatDateSpanish(selectedDayDetail)}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {selectedDayQuarterInfo && selectedDayQuarterInfo.isWithinYear && (
                <span className="badge-pill" style={{ backgroundColor: 'var(--color-surface-soft)', fontWeight: 700 }}>
                  Día {selectedDayQuarterInfo.dayNumberInYear} de 365 · {selectedDayQuarterInfo.statusLabel}
                </span>
              )}
              <div className="badge-pill">
                {new Date(selectedDayDetail) < new Date(todayStr)
                  ? 'Día Pasado'
                  : selectedDayDetail === todayStr
                  ? '¡Hoy es este día!'
                  : `Faltan ${Math.floor((new Date(selectedDayDetail).getTime() - new Date(todayStr).getTime()) / (1000*3600*24))} días`}
              </div>
            </div>
          </div>

          <div className="inspector-columns-grid">
            {/* Blogs on this day */}
            <div style={{ background: 'var(--color-surface-soft)', padding: 16, borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-muted)', margin: 0 }}>
                  Bitácoras ({blogEntries.filter(b => b.date === selectedDayDetail).length})
                </h4>
                {onWriteEntryForDate && (
                  <button
                    className="btn-text-link"
                    onClick={() => onWriteEntryForDate(selectedDayDetail)}
                    style={{ fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={13} /> Escribir
                  </button>
                )}
              </div>
              {blogEntries.filter(b => b.date === selectedDayDetail).length === 0 ? (
                <div>
                  <p className="body-sm" style={{ fontSize: 13, margin: '0 0 10px 0' }}>No hay entradas registradas en esta fecha.</p>
                  {onWriteEntryForDate && (
                    <button
                      className="btn-secondary btn-sm clay-button-interactive"
                      onClick={() => onWriteEntryForDate(selectedDayDetail)}
                      style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                      <Plus size={12} /> Escribir para este día
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {blogEntries.filter(b => b.date === selectedDayDetail).map(b => {
                    const theme = themes.find(t => t.id === b.themeId);
                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBlogEntry && onSelectBlogEntry(b)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-canvas)',
                          border: '1px solid var(--color-hairline)',
                          cursor: onSelectBlogEntry ? 'pointer' : 'default',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-ink)' }}>{b.title}</span>
                          {theme && (
                            <span
                              className="badge-pill"
                              style={{
                                fontSize: 10,
                                padding: '2px 8px',
                                backgroundColor: `var(--color-brand-${theme.color})`,
                                color: theme.color === 'teal' || theme.color === 'pink' || theme.color === 'coral' ? 'var(--color-on-dark)' : 'var(--color-ink)',
                              }}
                            >
                              {theme.name}
                            </span>
                          )}
                        </div>
                        {b.summary && (
                          <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>
                            {b.summary}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cycle context on this day */}
            <div style={{ background: 'var(--color-surface-soft)', padding: 16, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, margin: 0 }}>
                  Posición en el Ciclo 365
                </h4>
                {selectedDayQuarterInfo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-muted)' }}>Cuarto Estratégico:</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{selectedDayQuarterInfo.quarterName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-muted)' }}>Día del Ciclo:</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-brand-coral)' }}>Día {selectedDayQuarterInfo.dayNumberInYear} de 365</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-muted)' }}>Fase:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{selectedDayQuarterInfo.statusLabel}</span>
                    </div>
                  </div>
                )}
              </div>

              {onWriteEntryForDate && (
                <button
                  className="btn-primary btn-sm clay-button-interactive"
                  onClick={() => onWriteEntryForDate(selectedDayDetail)}
                  style={{ marginTop: 16 }}
                >
                  <Plus size={13} /> Nueva Entrada en este Día
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Bitácora Section with Quarters Filter */}
      <section className="quarters-reflections-section">
        <div className="section-header">
          <div>
            <span className="caption-uppercase" style={{ color: 'var(--color-brand-coral)' }}>
              Bitácora Anual & Reflexiones
            </span>
            <h2 className="section-title">Reflexiones del Año por Cuartos (Q1 - Q4)</h2>
            <p className="section-desc">
              Documentación sistemática del camino hacia el 2027 agrupada por fases estratégicas.
            </p>
          </div>
          {onWriteEntryForDate && (
            <button
              className="btn-primary btn-sm clay-button-interactive"
              onClick={() => onWriteEntryForDate(todayStr)}
            >
              <Plus size={14} /> Nueva Reflexión
            </button>
          )}
        </div>

        {/* Quarters Filter Tabs */}
        <div className="quarters-reflections-filters">
          <button
            className={`quarter-filter-btn ${selectedQuarterFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedQuarterFilter('all')}
          >
            Todas ({blogEntries.length})
          </button>
          {cycle365.quarters.map(q => {
            const count = blogEntries.filter(b => {
              const qInfo = getQuarterForDate(b.date, startDateStr);
              return qInfo.quarterId === q.id;
            }).length;

            return (
              <button
                key={q.id}
                className={`quarter-filter-btn ${selectedQuarterFilter === q.id ? 'active' : ''}`}
                onClick={() => setSelectedQuarterFilter(q.id)}
              >
                {q.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="quarters-reflections-list">
          {filteredBlogs.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '36px 20px',
              textAlign: 'center',
              background: 'var(--color-canvas)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--color-hairline)',
            }}>
              <p className="body-sm" style={{ marginBottom: 12 }}>
                No hay reflexiones registradas {selectedQuarterFilter !== 'all' ? `en el cuarto ${selectedQuarterFilter}` : 'aún'}.
              </p>
              {onWriteEntryForDate && (
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => onWriteEntryForDate(todayStr)}
                >
                  <Plus size={14} /> Escribir Primera Reflexión
                </button>
              )}
            </div>
          ) : (
            filteredBlogs.map(b => {
              const theme = themes.find(t => t.id === b.themeId);
              const dateParts = b.date.split('-');
              const qInfo = getQuarterForDate(b.date, startDateStr);

              return (
                <div
                  key={b.id}
                  className="reflection-item-card clay-button-interactive"
                  onClick={() => onSelectBlogEntry && onSelectBlogEntry(b)}
                  style={{ cursor: onSelectBlogEntry ? 'pointer' : 'default' }}
                >
                  <div className="reflection-card-top">
                    <div className="reflection-date-box">
                      <div className="reflection-date-day">{dateParts[2]}</div>
                      <div className="reflection-date-month">{dateParts[1]}/{dateParts[0]}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4 style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: 'var(--color-ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {b.title}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {qInfo.quarterId && (
                          <span
                            className="badge-pill"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              backgroundColor: 'var(--color-surface-soft)',
                              color: 'var(--color-ink)',
                              border: '1px solid var(--color-hairline)',
                            }}
                          >
                            {qInfo.quarterName}
                          </span>
                        )}

                        {theme && (
                          <span
                            className="badge-pill"
                            style={{
                              fontSize: 10,
                              backgroundColor: `var(--color-brand-${theme.color})`,
                              color: theme.color === 'teal' || theme.color === 'pink' || theme.color === 'coral' ? 'var(--color-on-dark)' : 'var(--color-ink)',
                            }}
                          >
                            {theme.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {b.summary && (
                    <p className="body-sm" style={{ fontSize: 13, marginTop: 8 }}>
                      {b.summary}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTop: '1px solid var(--color-hairline)', paddingTop: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      {b.readTimeMinutes || 3} min de lectura
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-brand-coral)' }}>
                      Leer reflexión →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
