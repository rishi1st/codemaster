/**
 * ProblemList.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fixes:
 *  1. problem.tags.split(',') — tags is an Array now, not a String. Fixed with
 *     normaliseTags() helper that handles both types safely.
 *  2. SortIndicator defined inside component — re-created every render.
 *     Extracted outside + memoized.
 *  3. generateAcceptanceRate defined inside component — same issue. Extracted.
 *  4. Pagination window calculation went negative when totalPages < 5.
 *     Replaced with a robust getPageWindow() function.
 *  5. framer-motion on every table row caused jank on long lists. Removed
 *     per-row animations; table fades in as a whole instead (one animation, not N).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { memo, useMemo } from 'react';
import {
  Search, Filter, X, ChevronLeft, ChevronRight,
  CheckCircle2, Circle, ArrowUpDown, ArrowUp, ArrowDown,
  RefreshCw, SlidersHorizontal, Loader2,
} from 'lucide-react';

const FONT = "'JetBrains Mono','Fira Code',monospace";

// ── Pure helpers (outside component — never recreated) ────────────────────────

// Bug fix #1: handles both Array and legacy comma-string
const normaliseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return tags.split(',').map((t) => t.trim()).filter(Boolean);
};

// Bug fix #3: extracted outside component
const generateAcceptanceRate = (problemId) => {
  if (!problemId) return 72;
  let hash = 0;
  for (let i = 0; i < problemId.length; i++) {
    hash = ((hash << 5) - hash) + problemId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 35) + 55; // 55–90
};

const DIFFICULTY_STYLE = {
  easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
};

// Bug fix #4: robust page window — no negative indices, works for any totalPages
const getPageWindow = (current, total, windowSize = 5) => {
  if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
  const half  = Math.floor(windowSize / 2);
  let start   = Math.max(1, current - half);
  const end   = Math.min(total, start + windowSize - 1);
  start       = Math.max(1, end - windowSize + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

// ── Sub-components ────────────────────────────────────────────────────────────

// Bug fix #2: extracted + memoized
const SortIcon = memo(({ columnKey, sortConfig }) => {
  if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} style={{ color: '#334155', marginLeft: 4 }} />;
  return sortConfig.direction === 'asc'
    ? <ArrowUp   size={12} style={{ color: '#818cf8', marginLeft: 4 }} />
    : <ArrowDown size={12} style={{ color: '#818cf8', marginLeft: 4 }} />;
});
SortIcon.displayName = 'SortIcon';

const FilterSelect = memo(({ label, value, onChange, options }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#e2e8f0', fontSize: 13, fontFamily: FONT,
        outline: 'none', cursor: 'pointer', appearance: 'none',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => { e.target.style.borderColor = 'rgba(129,140,248,0.4)'; }}
      onBlur={(e)  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
    >
      {options.map(({ value: v, label: l }) => (
        <option key={v} value={v} style={{ background: '#0c1025' }}>{l}</option>
      ))}
    </select>
  </div>
));
FilterSelect.displayName = 'FilterSelect';

const TagPill = memo(({ tag }) => (
  <span style={{
    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500,
    background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)',
    color: '#818cf8', whiteSpace: 'nowrap',
  }}>
    #{tag}
  </span>
));
TagPill.displayName = 'TagPill';

// ── Main component ────────────────────────────────────────────────────────────
const ProblemList = memo(({
  problems, solvedProblemIds, loading, error,
  searchTerm, filters, sortConfig, pagination,
  uniqueTags, mobileFiltersOpen,
  onSearch, onFilterChange, onSort, onClearFilters,
  onPageChange, onProblemClick, onMobileFiltersToggle, onRetry,
}) => {

  const solvedSet    = useMemo(() => new Set(solvedProblemIds), [solvedProblemIds]);
  const pageWindow   = useMemo(
    () => getPageWindow(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );
  const hasActiveFilters = filters.difficulty !== 'all' || filters.tag !== 'all' || filters.status !== 'all' || searchTerm;

  const tagOptions = useMemo(() => [
    { value: 'all', label: 'All Tags' },
    ...uniqueTags.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
  ], [uniqueTags]);

  return (
    <div style={{ fontFamily: FONT }}>

      {/* ── Search + Filter bar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '18px 20px', marginBottom: 16,
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} color="#334155" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={onSearch}
              placeholder="Search by title..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px 9px 36px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                color: '#e2e8f0', fontSize: 13, fontFamily: FONT, outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(129,140,248,0.4)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; }}
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '9px 13px', borderRadius: 8,
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                color: '#f87171', fontSize: 12, fontWeight: 500,
                fontFamily: FONT, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
            >
              <X size={13} /> Clear
            </button>
          )}

          {/* Mobile filter toggle */}
          <button
            onClick={() => onMobileFiltersToggle(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '9px 13px', borderRadius: 8,
              background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)',
              color: '#818cf8', fontSize: 12, fontWeight: 500,
              fontFamily: FONT, cursor: 'pointer',
            }}
            className="lg:hidden"
          >
            <SlidersHorizontal size={13} /> Filters
          </button>
        </div>

        {/* Desktop filter row */}
        <div className="hidden lg:grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FilterSelect
            label="Status" value={filters.status} onChange={(v) => onFilterChange('status', v)}
            options={[{ value: 'all', label: 'All Problems' }, { value: 'solved', label: 'Solved' }, { value: 'unsolved', label: 'Unsolved' }]}
          />
          <FilterSelect
            label="Difficulty" value={filters.difficulty} onChange={(v) => onFilterChange('difficulty', v)}
            options={[{ value: 'all', label: 'All Difficulty' }, { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]}
          />
          <FilterSelect label="Tag" value={filters.tag} onChange={(v) => onFilterChange('tag', v)} options={tagOptions} />
        </div>
      </div>

      {/* ── Mobile filter modal ── */}
      {mobileFiltersOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onMobileFiltersToggle(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 400, borderRadius: 16,
            background: 'linear-gradient(135deg, #0c1025, #080c1a)',
            border: '1px solid rgba(129,140,248,0.2)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            animation: 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff' }}>Filters</span>
              <button onClick={() => onMobileFiltersToggle(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FilterSelect
                label="Status" value={filters.status} onChange={(v) => onFilterChange('status', v)}
                options={[{ value: 'all', label: 'All Problems' }, { value: 'solved', label: 'Solved' }, { value: 'unsolved', label: 'Unsolved' }]}
              />
              <FilterSelect
                label="Difficulty" value={filters.difficulty} onChange={(v) => onFilterChange('difficulty', v)}
                options={[{ value: 'all', label: 'All Difficulty' }, { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]}
              />
              <FilterSelect label="Tag" value={filters.tag} onChange={(v) => onFilterChange('tag', v)} options={tagOptions} />
            </div>
            <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
              <button onClick={onClearFilters} style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#64748b', fontFamily: FONT, cursor: 'pointer',
              }}>Reset</button>
              <button onClick={() => onMobileFiltersToggle(false)} style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                border: '1px solid rgba(129,140,248,0.3)',
                color: '#f0f6ff', fontFamily: FONT, cursor: 'pointer',
              }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table card ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, overflow: 'hidden',
      }}>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ padding: '20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#334155', fontSize: 12 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Loading problems...
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: 52, borderRadius: 8, marginBottom: 8,
                background: 'rgba(255,255,255,0.03)',
                animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite`,
              }} />
            ))}
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#f87171', marginBottom: 16 }}>{error}</div>
            <button onClick={onRetry} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontFamily: FONT, cursor: 'pointer',
            }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* ── Table ── */}
        {!loading && !error && (
          <div style={{ overflowX: 'auto', animation: 'fadeIn 0.3s ease' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { key: null,         label: '',           width: 48   },
                    { key: 'title',      label: 'Title',      width: null },
                    { key: 'difficulty', label: 'Difficulty', width: 120  },
                    { key: null,         label: 'Tags',       width: null, hideOnMobile: true },
                    { key: 'acceptance', label: 'Acceptance', width: 130  },
                  ].map(({ key, label, width, hideOnMobile }, idx) => (
                    <th
                      key={idx}
                      onClick={key ? () => onSort(key) : undefined}
                      className={hideOnMobile ? 'hidden lg:table-cell' : ''}
                      style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontSize: 10, fontWeight: 700, color: '#334155',
                        letterSpacing: '0.07em', textTransform: 'uppercase',
                        background: 'rgba(255,255,255,0.02)',
                        cursor: key ? 'pointer' : 'default',
                        userSelect: 'none',
                        ...(width ? { width } : {}),
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => { if (key) e.currentTarget.style.color = '#818cf8'; }}
                      onMouseLeave={(e) => { if (key) e.currentTarget.style.color = '#334155'; }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {label}
                        {key && <SortIcon columnKey={key} sortConfig={sortConfig} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {problems.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#334155', marginBottom: 14 }}>
                        No problems found matching your criteria
                      </div>
                      <button onClick={onClearFilters} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                        border: '1px solid rgba(129,140,248,0.3)',
                        color: '#f0f6ff', fontFamily: FONT, cursor: 'pointer',
                      }}>
                        <X size={12} /> Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : problems.map((problem, rowIdx) => {
                  const isSolved     = solvedSet.has(problem._id);
                  const tags         = normaliseTags(problem.tags); // Bug fix #1
                  const diff         = problem.difficulty?.toLowerCase() || 'easy';
                  const dStyle       = DIFFICULTY_STYLE[diff] || DIFFICULTY_STYLE.easy;
                  const acceptance   = generateAcceptanceRate(problem._id); // Bug fix #3

                  return (
                    <tr
                      key={problem._id}
                      onClick={() => onProblemClick(problem._id)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        // Bug fix #5: no per-row animation, just CSS transition
                        animationDelay: `${rowIdx * 20}ms`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,140,248,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {isSolved
                          ? <CheckCircle2 size={15} color="#34d399" />
                          : <Circle       size={15} color="#1e293b" />
                        }
                      </td>

                      {/* Title */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isSolved ? '#64748b' : '#e2e8f0', marginBottom: 4 }}>
                          {problem.title}
                          {isSolved && (
                            <span style={{
                              marginLeft: 8, fontSize: 9, padding: '1px 6px', borderRadius: 10,
                              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                              color: '#34d399', fontWeight: 600, letterSpacing: '0.05em', verticalAlign: 'middle',
                            }}>
                              SOLVED
                            </span>
                          )}
                        </div>
                        {/* Mobile tags — Bug fix #1 */}
                        <div className="lg:hidden" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {tags.slice(0, 2).map((tag) => <TagPill key={tag} tag={tag} />)}
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                          color: dStyle.color, background: dStyle.bg,
                          border: `1px solid ${dStyle.border}`,
                          textTransform: 'capitalize', whiteSpace: 'nowrap',
                        }}>
                          {problem.difficulty}
                        </span>
                      </td>

                      {/* Tags — desktop — Bug fix #1 */}
                      <td className="hidden lg:table-cell" style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {tags.slice(0, 3).map((tag) => <TagPill key={tag} tag={tag} />)}
                          {tags.length > 3 && (
                            <span style={{ fontSize: 10, color: '#334155', alignSelf: 'center' }}>
                              +{tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acceptance */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, minWidth: 36 }}>
                            {acceptance}%
                          </span>
                          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 2,
                              width: `${acceptance}%`,
                              background: `linear-gradient(90deg, ${dStyle.color}, #818cf8)`,
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── Pagination ── */}
            {problems.length > 0 && pagination.totalPages > 0 && (
              <div style={{
                padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ fontSize: 12, color: '#334155' }}>
                  Showing{' '}
                  <span style={{ color: '#818cf8', fontWeight: 600 }}>
                    {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span style={{ color: '#818cf8', fontWeight: 600 }}>{pagination.total}</span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {/* Prev */}
                  <PageBtn
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    label={<ChevronLeft size={14} />}
                  />

                  {/* First page + ellipsis */}
                  {pageWindow[0] > 1 && (
                    <>
                      <PageBtn onClick={() => onPageChange(1)} label="1" />
                      {pageWindow[0] > 2 && <span style={{ color: '#334155', fontSize: 12, padding: '0 2px' }}>…</span>}
                    </>
                  )}

                  {/* Page window — Bug fix #4 */}
                  {pageWindow.map((p) => (
                    <PageBtn
                      key={p}
                      onClick={() => onPageChange(p)}
                      label={p}
                      active={p === pagination.page}
                    />
                  ))}

                  {/* Last page + ellipsis */}
                  {pageWindow[pageWindow.length - 1] < pagination.totalPages && (
                    <>
                      {pageWindow[pageWindow.length - 1] < pagination.totalPages - 1 && (
                        <span style={{ color: '#334155', fontSize: 12, padding: '0 2px' }}>…</span>
                      )}
                      <PageBtn onClick={() => onPageChange(pagination.totalPages)} label={pagination.totalPages} />
                    </>
                  )}

                  {/* Next */}
                  <PageBtn
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    label={<ChevronRight size={14} />}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        .hidden { display:none !important }
        @media(min-width:1024px){ .hidden.lg\\:grid{display:grid!important} .hidden.lg\\:table-cell{display:table-cell!important} }
        @keyframes fadeIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.95)}    to{opacity:1;transform:scale(1)}    }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes shimmer  {
          0%,100%{opacity:0.4} 50%{opacity:0.7}
        }
        @keyframes slideDown{ from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        select option{ background:#0c1025; color:#e2e8f0; }
        input::placeholder{ color:#334155; }
      `}</style>
    </div>
  );
});

// ── PageBtn helper ────────────────────────────────────────────────────────────
const PageBtn = memo(({ onClick, disabled = false, label, active = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      minWidth: 32, height: 32, borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: active ? 700 : 500,
      fontFamily: FONT, cursor: disabled ? 'not-allowed' : 'pointer',
      border: `1px solid ${active ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
      background: active
        ? 'linear-gradient(135deg, #4f46e5, #6d28d9)'
        : 'rgba(255,255,255,0.03)',
      color: active ? '#f0f6ff' : disabled ? '#1e293b' : '#64748b',
      transition: 'all 0.15s', padding: '0 4px',
    }}
    onMouseEnter={(e) => { if (!disabled && !active) { e.currentTarget.style.background = 'rgba(129,140,248,0.1)'; e.currentTarget.style.color = '#94a3b8'; } }}
    onMouseLeave={(e) => { if (!disabled && !active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#64748b'; } }}
  >
    {label}
  </button>
));
PageBtn.displayName = 'PageBtn';

ProblemList.displayName = 'ProblemList';
export default ProblemList;
