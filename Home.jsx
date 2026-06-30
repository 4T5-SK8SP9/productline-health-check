import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import { loadCategories } from './questions.js'

export default function Home({ go }) {
  const [categories, setCategories] = useState([
    { name: 'Team Structure', color: '#2D6A4F', questions: Array(6) },
    { name: 'Product Focus', color: '#1B4F72', questions: Array(6) },
    { name: 'Team Process', color: '#6B2D8B', questions: Array(7) },
    { name: 'Technical Disciplines', color: '#7D3C0A', questions: Array(6) },
  ])

  useEffect(() => {
    loadCategories(db).then(cats => setCategories(cats))
  }, [])
  return (
    <div className="page" style={{ paddingTop: '3rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12 }}>Team Health Check</div>
        <h1 style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.25, marginBottom: 12 }}>How healthy is your team?</h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.65 }}>
          {categories.reduce((sum, c) => sum + c.questions.length, 0)} questions across {categories.length} dimensions. Everyone votes anonymously on their own device.
          Votes reveal only when the whole team has answered. Lowest score is final.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: '2rem' }}>
        {categories.map(c => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${c.color}` }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.questions.length} questions</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.5rem' }}>
        <button className="btn-primary" onClick={() => go('create')} style={{ width: '100%' }}>Create session</button>
        <button className="btn-secondary" onClick={() => go('join')} style={{ width: '100%' }}>Join session</button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
        Facilitator creates a session and shares the code.<br />
        Team members join on their own devices.
      </p>

      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <button onClick={() => go('admin')} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>
          ⚙ Admin
        </button>
      </div>
    </div>
  )
}
