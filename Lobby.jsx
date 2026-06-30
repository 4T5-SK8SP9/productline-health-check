import { useState, useEffect } from 'react'
import { listenSession, startSession, getJoinUrl } from './firebaseHelpers.js'
import QRCode from './QRCode.jsx'

export default function Lobby({ sessionData, go }) {
  const { sessionId, teamName, memberName, role } = sessionData
  const [session, setSession] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsub = listenSession(sessionId, data => {
      setSession(data)
      if (data.status === 'voting') go('voting')
    })
    return () => unsub()
  }, [sessionId])

  const members = session ? Object.values(session.members || {}) : []
  const isFacilitator = role === 'facilitator'
  const joinUrl = getJoinUrl(sessionId)

  function copyLink() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="page" style={{ paddingTop: '2rem' }}>

      {/* Transcription nudge */}
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#14532D', marginBottom: 4 }}>💬 Tip: Turn on transcription</div>
        <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
          We recommend enabling transcription in Teams or Zoom before you start. The discussion between votes is where the real insights happen — capturing it lets your team reflect on it later.
        </div>
      </div>

      {/* Session code */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div className="label" style={{ marginBottom: 8 }}>Session code</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 42, fontWeight: 500, letterSpacing: '0.12em' }}>
          {sessionId}
        </div>
      </div>

      {/* QR Code - always visible for late joiners */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scan to join</div>
        <QRCode value={joinUrl} size={180} />
        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
          Point your phone camera at the code<br />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{sessionId}</span>
        </div>
      </div>

      {/* Join link */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {joinUrl}
        </div>
        <button onClick={copyLink} style={{ padding: '5px 12px', background: copied ? '#F0FDF4' : 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: copied ? '#14532D' : 'var(--text2)', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
      </div>

      {/* Members */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 12 }}>
          {members.length} {members.length === 1 ? 'person' : 'people'} in the lobby
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {members.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
                {m.name?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: 14 }}>{m.name}</span>
              {m.name === memberName && <span style={{ fontSize: 11, color: 'var(--text3)' }}>(you)</span>}
              {session?.facilitator === m.name && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>facilitator</span>}
            </div>
          ))}
        </div>
      </div>

      {isFacilitator ? (
        <>
          <button className="btn-primary" onClick={() => startSession(sessionId)} disabled={members.length < 1} style={{ width: '100%', marginBottom: 10 }}>
            Start assessment →
          </button>
          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
            All members will move to voting simultaneously
          </p>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 8 }}>Waiting for facilitator to start…</div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)', animation: `pulse 1.4s ${i * 0.2}s infinite` }} />)}
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}
