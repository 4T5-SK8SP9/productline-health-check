import { useState } from 'react'
import { createSession } from './firebaseHelpers.js'

export default function CreateSession({ go }) {
  const [teamName, setTeamName] = useState('')
  const [facilitatorName, setFacilitatorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!teamName.trim() || !facilitatorName.trim()) return
    setLoading(true)
    setError('')
    try {
      const code = await createSession({ teamName: teamName.trim(), facilitatorName: facilitatorName.trim() })
      go('lobby', { sessionId: code, teamName: teamName.trim(), memberName: facilitatorName.trim(), role: 'facilitator' })
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ paddingTop: '2.5rem' }}>
      <button onClick={() => go('home')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, padding: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Back
      </button>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Create a session</h2>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '2rem', lineHeight: 1.5 }}>
        You'll get a 6-character code to share with your team.
      </p>

      <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <label className="label">Team name</label>
          <input
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="e.g. Athena team"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <div>
          <label className="label">Your name (facilitator)</label>
          <input
            value={facilitatorName}
            onChange={e => setFacilitatorName(e.target.value)}
            placeholder="e.g. Jacob"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>
      </div>

      {error && <p style={{ fontSize: 13, color: '#B00020', marginBottom: '1rem' }}>{error}</p>}

      <button
        className="btn-primary"
        onClick={handleCreate}
        disabled={!teamName.trim() || !facilitatorName.trim() || loading}
        style={{ width: '100%' }}
      >
        {loading ? 'Creating…' : 'Create session →'}
      </button>
    </div>
  )
}
