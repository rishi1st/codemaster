/**
 * Editorial.jsx
 * Bug fix: backend returns video nested under problem.video.secureUrl
 * but this component was reading problem.secureUrl (top-level) → always undefined
 * → Editorial always showed "Coming Soon" even when a video existed.
 *
 * Fix: read BOTH problem.secureUrl (flat, for backward compat after backend fix)
 * AND problem.video?.secureUrl (nested). Whichever is present wins.
 */
import React, { useState } from 'react';
import { Play, Clock, Video, AlertCircle } from 'lucide-react';

const FONT = "'JetBrains Mono','Fira Code',monospace";

const Editorial = ({ problem }) => {
  const [showVideo,  setShowVideo]  = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!problem) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32, fontFamily: FONT }}>
      <p style={{ color: '#334155', fontSize: 13 }}>No problem loaded.</p>
    </div>
  );

  // Bug fix: support both flat (problem.secureUrl) and nested (problem.video.secureUrl)
  const secureUrl    = problem.secureUrl    || problem.video?.secureUrl;
  const thumbnailUrl = problem.thumbnailUrl || problem.video?.thumbnailUrl;

  return (
    <div style={{ padding: 20, fontFamily: FONT }}>

      {/* Header card */}
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)' }} />
        <div style={{
          padding: '14px 18px',
          background: 'rgba(79,70,229,0.07)',
          border: '1px solid rgba(79,70,229,0.18)', borderTop: 'none', borderRadius: '0 0 12px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={15} color="#818cf8" />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Editorial Solution</h2>
          </div>
          <p style={{ fontSize: 11, color: '#334155', margin: '4px 0 0' }}>
            Step-by-step video walkthrough for {problem.title}
          </p>
        </div>
      </div>

      {/* Video section */}
      {secureUrl ? (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {!showVideo ? (
            /* Thumbnail / play button */
            <div
              onClick={() => { setShowVideo(true); setVideoError(false); }}
              style={{
                height: 220, cursor: 'pointer', position: 'relative',
                background: thumbnailUrl
                  ? `url(${thumbnailUrl}) center/cover no-repeat`
                  : 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(34,211,238,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {/* Overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

              {/* Play button */}
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(79,70,229,0.85)',
                  border: '2px solid rgba(129,140,248,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: '0 0 32px rgba(79,70,229,0.6)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 0 48px rgba(79,70,229,0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 0 32px rgba(79,70,229,0.6)';
                }}
                >
                  <Play size={24} color="#fff" style={{ marginLeft: 3 }} />
                </div>
                <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, margin: 0, fontFamily: FONT }}>
                  Play solution video
                </p>
                {problem.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                    <Clock size={10} color="#94a3b8" />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{problem.duration}</span>
                  </div>
                )}
              </div>
            </div>
          ) : videoError ? (
            /* Video load error */
            <div style={{ padding: 28, textAlign: 'center', background: 'rgba(248,113,113,0.06)' }}>
              <AlertCircle size={28} color="#f87171" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>Failed to load video.</p>
              <button
                onClick={() => { setVideoError(false); setShowVideo(false); }}
                style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 12,
                  background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171', cursor: 'pointer', fontFamily: FONT,
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            /* Video player */
            <video
              src={secureUrl}
              poster={thumbnailUrl}
              controls
              autoPlay
              onError={() => setVideoError(true)}
              style={{ width: '100%', maxHeight: 340, background: '#000', display: 'block' }}
            />
          )}
        </div>
      ) : (
        /* No video available */
        <div style={{
          padding: '36px 24px', textAlign: 'center',
          border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(129,140,248,0.08)',
            border: '1px solid rgba(129,140,248,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 24,
          }}>
            🎬
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            Editorial Coming Soon
          </h3>
          <p style={{ fontSize: 12, color: '#334155', maxWidth: 280, margin: '0 auto' }}>
            The video solution for this problem hasn't been published yet. Check back after the contest ends.
          </p>
        </div>
      )}
    </div>
  );
};

export default Editorial;
