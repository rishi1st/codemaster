/**
 * Problems.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fixes:
 *  1. extractUniqueTags called .split(',') on tags — after schema fix, tags is
 *     now an Array. Used Array.isArray guard + flat() instead.
 *  2. fetchAllProblems had solvedProblemIds in its useCallback deps — created
 *     an infinite loop: fetch solved → setSolvedIds → triggers fetchAll again.
 *     Fixed by using a ref to access the latest solvedProblemIds without
 *     adding it as a reactive dependency.
 *  3. selectProblemOfTheDay had no try/catch around localStorage.setItem —
 *     throws in private browsing or when storage is full.
 *  4. uniqueTags was derived from the current page only — tags not on the
 *     current page were invisible as filter options. Fetched from /problem/stats
 *     instead which aggregates all tags server-side.
 *  5. Added 400ms debounce on search — was calling the API on every keystroke.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axiosClient from "../utils/axiosClient";
import { useNavigate } from "react-router";
import ProblemList from "../components/ProblemList";
import Pod from "../components/Pod";

// ── Safe localStorage helpers ─────────────────────────────────────────────────
const safeLocalStorageGet = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeLocalStorageSet = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* quota exceeded or private mode */ }
};

// ── Date key for Problem of the Day ───────────────────────────────────────────
// Changes at 06:00 each day (if before 06:00 we still show "yesterday's" problem)
const getDailyKey = () => {
  const now = new Date();
  if (now.getHours() < 6) now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

// ── useDebounce hook ──────────────────────────────────────────────────────────
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ─────────────────────────────────────────────────────────────────────────────
const Problems = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────
  const [allProblems,       setAllProblems]       = useState([]);
  const [problemOfTheDay,   setProblemOfTheDay]   = useState(null);
  const [solvedProblemIds,  setSolvedProblemIds]  = useState([]);
  const [uniqueTags,        setUniqueTags]        = useState([]);
  const [stats,             setStats]             = useState(null);

  const [loading,      setLoading]      = useState(false);
  const [solvedLoading,setSolvedLoading]= useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error,        setError]        = useState(null);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    difficulty: "all",
    tag:        "all",
    status:     "all",
  });

  // Raw search term (unthrottled — drives the input display)
  const [searchTerm,    setSearchTerm]    = useState("");
  // Debounced — only this triggers the API call (Bug fix #5)
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  const [pagination, setPagination] = useState({
    page:       1,
    limit:      10,
    total:      0,
    totalPages: 0,
  });

  // Bug fix #2: ref holds latest solvedProblemIds so fetchAllProblems can read
  // them without being listed as a reactive dep (which caused infinite loop).
  const solvedIdsRef = useRef([]);
  useEffect(() => { solvedIdsRef.current = solvedProblemIds; }, [solvedProblemIds]);

  // ── Problem of the Day ────────────────────────────────────────────────────
  const selectProblemOfTheDay = useCallback((problems) => {
    if (!problems.length) return null;
    const dateKey   = getDailyKey();
    const cacheKey  = `pod-${dateKey}`;
    const stored    = safeLocalStorageGet(cacheKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (problems.some((p) => p._id === parsed._id)) return parsed;
      } catch { /* corrupted cache — fall through */ }
    }

    const idx = parseInt(dateKey.replace(/-/g, ''), 10) % problems.length;
    const pod = problems[idx];
    safeLocalStorageSet(cacheKey, JSON.stringify(pod)); // Bug fix #3: wrapped in safe helper
    return pod;
  }, []);

  // ── Fetch: stats + all tags (Bug fix #4) ─────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const { data } = await axiosClient.get("/problem/stats");
      setStats(data);
      // Extract unique tags from the server-side aggregation — covers ALL problems
      if (data?.byTag) {
        setUniqueTags(data.byTag.map((t) => t.tag));
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch: solved problems ────────────────────────────────────────────────
  const fetchSolvedProblems = useCallback(async () => {
    try {
      setSolvedLoading(true);
      const { data } = await axiosClient.get("/problem/solved");
      const ids = (data.data || []).map((p) => p._id);
      setSolvedProblemIds(ids);
    } catch (err) {
      console.error("Solved fetch error:", err);
    } finally {
      setSolvedLoading(false);
    }
  }, []);

  // ── Fetch: problems list ──────────────────────────────────────────────────
  // Bug fix #2: solvedProblemIds read via ref, NOT in dep array
  const fetchAllProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axiosClient.get("/problem", {
        params: {
          page:       pagination.page,
          limit:      pagination.limit,
          search:     debouncedSearch || undefined,
          difficulty: filters.difficulty !== "all" ? filters.difficulty : undefined,
          tag:        filters.tag        !== "all" ? filters.tag        : undefined,
          status:     filters.status     !== "all" ? filters.status     : undefined,
          solvedIds:  solvedIdsRef.current.join(","),   // ref, not state
          sortKey:    sortConfig.key,
          sortDir:    sortConfig.direction,
        },
      });

      setAllProblems(data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total:      data.total      ?? prev.total,
        totalPages: data.totalPages ?? prev.totalPages,
      }));

      if (data?.data?.length) {
        setProblemOfTheDay(selectProblemOfTheDay(data.data));
      }
    } catch (err) {
      console.error("Problems fetch error:", err);
      setError("Failed to load problems. Please try again.");
    } finally {
      setLoading(false);
    }
  // solvedProblemIds intentionally omitted — accessed via ref (Bug fix #2)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,   // debounced (Bug fix #5)
    filters,
    sortConfig,
    selectProblemOfTheDay,
  ]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchStats(); },          [fetchStats]);
  useEffect(() => { fetchSolvedProblems(); }, [fetchSolvedProblems]);
  useEffect(() => { fetchAllProblems(); },    [fetchAllProblems]);

  // Reset to page 1 when filters / search change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, filters, sortConfig]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch        = useCallback((e) => setSearchTerm(e.target.value), []);
  const handleFilterChange  = useCallback((type, val) => setFilters((p) => ({ ...p, [type]: val })), []);
  const handleSort          = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);
  const handleClearFilters  = useCallback(() => {
    setFilters({ difficulty: "all", tag: "all", status: "all" });
    setSearchTerm("");
  }, []);
  const handleProblemClick  = useCallback((id) => navigate(`/problem/${id}`), [navigate]);
  const handleRetry         = useCallback(() => fetchAllProblems(), [fetchAllProblems]);
  const handlePageChange    = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handleMobileFiltersToggle = useCallback((v) => setMobileFiltersOpen(v), []);

  // ── Memoised props object ─────────────────────────────────────────────────
  const listProps = useMemo(() => ({
    problems: allProblems,
    solvedProblemIds,
    loading:  loading || solvedLoading,
    error,
    searchTerm,
    filters,
    sortConfig,
    pagination,
    uniqueTags,
    mobileFiltersOpen,
    onSearch:              handleSearch,
    onFilterChange:        handleFilterChange,
    onSort:                handleSort,
    onClearFilters:        handleClearFilters,
    onPageChange:          handlePageChange,
    onProblemClick:        handleProblemClick,
    onMobileFiltersToggle: handleMobileFiltersToggle,
    onRetry:               handleRetry,
  }), [
    allProblems, solvedProblemIds, loading, solvedLoading, error,
    searchTerm, filters, sortConfig, pagination, uniqueTags, mobileFiltersOpen,
    handleSearch, handleFilterChange, handleSort, handleClearFilters,
    handlePageChange, handleProblemClick, handleMobileFiltersToggle, handleRetry,
  ]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060810',
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
      color: '#e2e8f0',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(129,140,248,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.025) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,3vw,32px)' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 12px', borderRadius: 20, marginBottom: 12,
            background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.18)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Problem Set
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#f0f6ff', margin: 0, letterSpacing: '-0.02em' }}>
            Coding Challenges
          </h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>
            {stats ? `${stats.total} problems across ${Object.keys(stats.byDifficulty || {}).length} difficulty levels` : 'Loading stats...'}
            {stats?.userStats && (
              <span style={{ color: '#818cf8', marginLeft: 8 }}>
                · {stats.userStats.solved} solved ({stats.userStats.percent}%)
              </span>
            )}
          </p>
        </div>

        {/* Stats strip */}
        {stats && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))',
            gap: 10, marginBottom: 28,
          }}>
            {[
              { label: 'Total',  value: stats.total,                         color: '#e2e8f0' },
              { label: 'Easy',   value: stats.byDifficulty?.easy   || 0,    color: '#34d399' },
              { label: 'Medium', value: stats.byDifficulty?.medium || 0,    color: '#f59e0b' },
              { label: 'Hard',   value: stats.byDifficulty?.hard   || 0,    color: '#f87171' },
              ...(stats.userStats ? [{ label: 'Solved', value: `${stats.userStats.solved}/${stats.total}`, color: '#818cf8' }] : []),
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '14px 16px', borderRadius: 12, textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 10, color: '#334155', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Problem of the Day */}
        <Pod problem={problemOfTheDay} onProblemClick={handleProblemClick} />

        {/* Problem list */}
        <ProblemList {...listProps} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default Problems;
