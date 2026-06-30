import { useState, useEffect } from 'react'
import { joinSession } from './firebaseHelpers.js'

export default function JoinSession({ sessionData, go }) {
  const [code, setCode] = useState(sessionData?.prefillCode || '')
  const [memberName, setMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionData?.prefillCode) setCode(sessionData.prefillCode)
  }, [sessionData?.prefillCode])

  async function handleJoin() {
    if (!code.trim() || !memberName.trim()) return
    setLoading(true)
    setError('')
    try {
      const session = await joinSession({ code: code.trim().toUpperCase(), memberName: memberName.trim() })
      go('lobby', {
        sessionId: code.trim().toUpperCase(),
        teamName: session.teamName,
        memberName: memberName.trim(),
        role: 'member'
      })
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ paddingTop: '2.5rem' }}>
      <button onClick={() => go('home')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, padding: 0, marginBottom: '1.5rem' }}>← Back</button>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Join a session</h2>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '2rem' }}>Enter the session code or use the link your facilitator shared.</p>
      <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <label className="label">Session code</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. AB3X7K" maxLength={6}
            style={{ fontFamily: 'var(--mono)', fontSize: 22, letterSpacing: '0.15em', textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()} />
        </div>
        <div>
          <label className="label">Your name</label>
          <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="e.g. Sarah"
            onKeyDown={e => e.key === 'Enter' && handleJoin()} />
        </div>
      </div>
      {error && <p style={{ fontSize: 13, color: '#B00020', marginBottom: '1rem' }}>{error}</p>}
      <button className="btn-primary" onClick={handleJoin} disabled={code.length < 4 || !memberName.trim() || loading} style={{ width: '100%' }}>
        {loading ? 'Joining…' : 'Join session →'}
      </button>
    </div>
  )
}
