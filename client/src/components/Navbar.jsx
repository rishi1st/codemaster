import { Link, useNavigate, useLocation } from 'react-router';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/authSlice';
import {
  User, Settings, LogOut, LayoutGrid, ChevronDown,
  Menu, X, Terminal, Cpu, Brain, Code2, Zap, BookOpen,
} from 'lucide-react';

// ── Nav links config ───────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/problems',   label: 'Problems',   icon: Code2    },
  { to: '/visualize',  label: 'Visualize',  icon: Cpu      },
  
  { to: '/docs',       label: 'Docs',       icon: BookOpen },
  { to: '/ai',         label: 'AI',         icon: Zap,  badge: 'NEW' },
  { to: '/compiler',   label: 'Compiler',   icon: Terminal },
];

// ── Pure JS media query hook — eliminates Tailwind hidden/flex conflicts ──
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    setIsDesktop(mq.matches); // sync immediately
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
};

// ─────────────────────────────────────────────────────────────────────────────
const Navbar = memo(() => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useSelector((s) => s.auth);
  const isDesktop  = useIsDesktop();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [visible,      setVisible]      = useState(false);

  const dropdownRef = useRef(null);
  const FONT = "'JetBrains Mono','Fira Code',monospace";

  // Entrance slide-down
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Scroll blur/border
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Reset menus on navigation
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close mobile menu when viewport grows to desktop
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await dispatch(logoutUser());
    navigate('/login');
  }, [dispatch, navigate]);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + (user.lastName?.charAt(0).toUpperCase() || '')
    : 'U';

  const Avatar = ({ size = 28 }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #4f46e5, #22d3ee)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#f0f6ff',
      overflow: 'hidden',
    }}>
      {user?.profilePhoto
        ? <img src={user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials
      }
    </div>
  );

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        fontFamily: FONT,
        background: scrolled ? 'rgba(6,8,16,0.94)' : 'rgba(6,8,16,0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(129,140,248,0.13)' : 'transparent'}`,
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.55)' : 'none',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease, background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}>

        {/* Accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #4f46e5 30%, #818cf8 50%, #22d3ee 70%, transparent 100%)',
          opacity: scrolled ? 1 : 0.4,
          transition: 'opacity 0.3s',
        }} />

        {/* ── Main row ─────────────────────────────────────────────────────── */}
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 clamp(16px, 3vw, 32px)',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>

          {/* LEFT: Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(79,70,229,0.25), rgba(34,211,238,0.25))',
                border: '1px solid rgba(129,140,248,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Terminal size={15} color="#818cf8" />
              </div>
              <span style={{
                fontSize: 15, fontWeight: 700, letterSpacing: '0.02em',
                background: 'linear-gradient(90deg, #c4b5fd, #818cf8, #22d3ee)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
              }}>
                CodeMaster
              </span>
            </div>
          </Link>

          {/* CENTER: Nav links — only rendered on desktop, takes remaining space */}
          {isDesktop && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              overflow: 'hidden',
            }}>
              {NAV_LINKS.map(({ to, label, icon: Icon, badge }) => {
                const active = isActive(to);
                return (
                  <Link key={to} to={to} style={{ textDecoration: 'none', position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 10px', borderRadius: 8,
                        fontSize: 12, fontWeight: active ? 600 : 500,
                        letterSpacing: '0.02em', whiteSpace: 'nowrap', cursor: 'pointer',
                        color: active ? '#e2e8f0' : '#64748b',
                        background: active ? 'rgba(129,140,248,0.1)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(129,140,248,0.22)' : 'transparent'}`,
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = '#94a3b8';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = '#64748b';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Icon size={12} style={{ flexShrink: 0 }} />
                      {label}
                      {badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10,
                          background: 'linear-gradient(90deg, #22d3ee, #818cf8)',
                          color: '#f0f6ff', letterSpacing: '0.06em', lineHeight: 1.6,
                        }}>
                          {badge}
                        </span>
                      )}
                    </div>
                    {/* Active underline dot */}
                    {active && (
                      <div style={{
                        position: 'absolute', bottom: -1, left: '50%',
                        transform: 'translateX(-50%)',
                        width: '55%', height: 2, borderRadius: 1,
                        background: 'linear-gradient(90deg, #818cf8, #22d3ee)',
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* RIGHT: Actions */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>

            {/* Pro button — desktop only */}
            {isDesktop && (
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 13px', borderRadius: 20, whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, rgba(79,70,229,0.14), rgba(34,211,238,0.14))',
                border: '1px solid rgba(129,140,248,0.25)',
                color: '#c4b5fd', fontSize: 12, fontWeight: 600,
                fontFamily: FONT, cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.24), rgba(34,211,238,0.24))';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(129,140,248,0.18)';
                e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.14), rgba(34,211,238,0.14))';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(129,140,248,0.25)';
              }}
              >
                <Zap size={11} />
                Pro
              </button>
            )}

            {/* Profile pill — desktop + user logged in */}
            {isDesktop && user && (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 4px 4px 10px', borderRadius: 24,
                    background: dropdownOpen ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${dropdownOpen ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.09)'}`,
                    cursor: 'pointer', fontFamily: FONT, transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!dropdownOpen) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!dropdownOpen) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                    }
                  }}
                >
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {user.firstName}
                  </span>
                  <Avatar size={28} />
                  <ChevronDown
                    size={12} color="#475569"
                    style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
                  />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 224, borderRadius: 12,
                    background: 'linear-gradient(135deg, #0c1025, #080c1a)',
                    border: '1px solid rgba(129,140,248,0.15)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(129,140,248,0.05)',
                    overflow: 'hidden', zIndex: 100,
                    animation: 'dropIn 0.22s cubic-bezier(0.16,1,0.3,1)',
                  }}>
                    {/* Header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar size={36} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.firstName} {user.lastName || ''}
                          </p>
                          <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.emailId}
                          </p>
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <div style={{
                          marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '2px 8px', borderRadius: 10,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }} />
                          <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin</span>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div style={{ padding: '6px 0' }}>
                      {[
                        { to: '/profile',  icon: User,       label: 'Profile'    },
                        { to: '/settings', icon: Settings,   label: 'Settings'   },
                        ...(user.role === 'admin' ? [{ to: '/admin', icon: LayoutGrid, label: 'Admin Panel' }] : []),
                      ].map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to} onClick={() => setDropdownOpen(false)} style={{ textDecoration: 'none' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 16px', fontSize: 13, color: '#94a3b8',
                            transition: 'all 0.14s', cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,140,248,0.08)'; e.currentTarget.style.color = '#e2e8f0'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                          >
                            <Icon size={13} />
                            {label}
                          </div>
                        </Link>
                      ))}

                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                      <button onClick={handleLogout} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 16px', fontSize: 13, color: '#f87171',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: FONT, transition: 'all 0.14s', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <LogOut size={13} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sign In / Get Started — desktop + not logged in */}
            {isDesktop && !user && (
              <>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    color: '#64748b', border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'all 0.2s', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    Sign In
                  </div>
                </Link>
                <Link to="/signup" style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: '#f0f6ff',
                    background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                    border: '1px solid rgba(129,140,248,0.3)',
                    boxShadow: '0 2px 12px rgba(79,70,229,0.2)',
                    transition: 'all 0.2s', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.38)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(79,70,229,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Get Started
                  </div>
                </Link>
              </>
            )}

            {/* Hamburger — mobile ONLY, conditionally rendered */}
            {!isDesktop && (
              <button
                onClick={() => setMobileOpen((p) => !p)}
                style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: mobileOpen ? 'rgba(129,140,248,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${mobileOpen ? 'rgba(129,140,248,0.28)' : 'rgba(255,255,255,0.09)'}`,
                  cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s',
                }}
              >
                {mobileOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {!isDesktop && (
          <div style={{
            overflow: 'hidden',
            maxHeight: mobileOpen ? 720 : 0,
            transition: 'max-height 0.42s cubic-bezier(0.16,1,0.3,1)',
            borderTop: mobileOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{ padding: '12px 16px 20px', background: 'rgba(6,8,16,0.98)' }}>

              {user && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 10,
                  background: 'rgba(129,140,248,0.07)',
                  border: '1px solid rgba(129,140,248,0.12)',
                }}>
                  <Avatar size={34} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                      {user.firstName} {user.lastName || ''}
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.emailId}
                    </p>
                  </div>
                </div>
              )}

              {NAV_LINKS.map(({ to, label, icon: Icon, badge }) => {
                const active = isActive(to);
                return (
                  <Link key={to} to={to} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8, fontSize: 13,
                      color: active ? '#e2e8f0' : '#64748b',
                      background: active ? 'rgba(129,140,248,0.1)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(129,140,248,0.2)' : 'transparent'}`,
                    }}>
                      <Icon size={13} />
                      {label}
                      {badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10,
                          background: 'linear-gradient(90deg, #22d3ee, #818cf8)', color: '#f0f6ff',
                        }}>{badge}</span>
                      )}
                    </div>
                  </Link>
                );
              })}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />

              {user ? (
                <>
                  {[
                    { to: '/profile',  icon: User,       label: 'Profile'    },
                    { to: '/settings', icon: Settings,   label: 'Settings'   },
                    ...(user.role === 'admin' ? [{ to: '/admin', icon: LayoutGrid, label: 'Admin Panel' }] : []),
                  ].map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8, fontSize: 13, color: '#64748b',
                      }}>
                        <Icon size={13} />
                        {label}
                      </div>
                    </Link>
                  ))}
                  <button onClick={handleLogout} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    fontSize: 13, color: '#f87171',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: FONT, marginTop: 2,
                  }}>
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      color: '#94a3b8', textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)',
                    }}>Sign In</div>
                  </Link>
                  <Link to="/signup" style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      color: '#f0f6ff', textAlign: 'center',
                      background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                      border: '1px solid rgba(129,140,248,0.3)',
                    }}>Get Started Free</div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Height spacer */}
      <div style={{ height: 60 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
});

Navbar.displayName = 'Navbar';
export default Navbar;
