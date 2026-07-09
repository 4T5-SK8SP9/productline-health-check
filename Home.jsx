import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import { loadCategories } from './questions.js'

const FACILITATOR_STEPS = [
  {
    n: '1',
    title: 'Read the question aloud',
    desc: 'Read the question to the group. Give everyone 1 minute to read the score descriptions (1 = struggling, 5 = thriving).'
  },
  {
    n: '2',
    title: 'Take clarifying questions',
    desc: 'Ask if anyone needs the question clarified before voting. Keep it brief — answer the question, don\'t debate it yet.'
  },
  {
    n: '3',
    title: 'Open voting',
    desc: 'Ask everyone to vote on their own device. Votes are hidden until everyone has submitted. No peeking, no influencing.'
  },
  {
    n: '4',
    title: 'Reveal & let it land',
    desc: 'Votes reveal automatically when everyone has voted. Give the group 10 seconds of silence to take in the scores before anyone speaks.'
  },
  {
    n: '5',
    title: 'Perfect alignment → move on',
    desc: 'If all votes are the same, the tool shows a "Perfect alignment" message and advances automatically. You may still invite a brief comment before moving on.'
  },
  {
    n: '6',
    title: 'Split votes → discuss',
    desc: 'If votes differ, hear from at least one low scorer and one high scorer before Round 2. Try: "Why you gave a 2 — what's behind that?" or "What would move you from a 4 to a 5?" Be mindful of time — no deep dives.'
  },
  {
    n: '7',
    title: 'Start Round 2',
    desc: 'Say: "Consider what was just shared — now give your final vote." Open Round 2 voting. The lowest score from Round 2 is recorded as the Product Line\'s score for this question.'
  },
  {
    n: '8',
    title: 'Why the lowest score?',
    desc: 'Participants may ask why the lowest score wins instead of an average. The answer: "If even one representative scores this low, the Product Line needs to address it — regardless of what the majority scored."'
  },
  {
    n: '9',
    title: 'Repeat for each question',
    desc: 'Move to the next question and repeat the process. Stay focused through all questions.'
  },
]

export default function Home({ go }) {
  const [categories, setCategories] = useState([
    { name: 'Product Line Structure', color: '#2D6A4F', questions: Array(6) },
    { name: 'Product Focus', color: '#1B4F72', questions: Array(6) },
    { name: 'Product Line Process', color: '#6B2D8B', questions: Array(7) },
    { name: 'Technical Disciplines', color: '#7D3C0A', questions: Array(4) },
  ])
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    loadCategories(db).then(cats => setCategories(cats))
  }, [])

  return (
    <div className="page" style={{ paddingTop: '3rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12 }}>Product Line Health Check</div>
        <h1 style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.25, marginBottom: 12 }}>How healthy is your Product Line?</h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.65 }}>
          {categories.reduce((sum, c) => sum + c.questions.length, 0)} questions across {categories.length} dimensions. Representatives vote anonymously on their own device.
          Votes reveal only when everyone has answered. Lowest score is final.
        </p>
      </div>

      {/* Facilitator guide dropdown */}
      <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <button
          onClick={() => setGuideOpen(v => !v)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}
        >
          <span>📋 How to facilitate this session</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', transition: 'transform 0.2s', display: 'inline-block', transform: guideOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {guideOpen && (
          <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            {FACILITATOR_STEPS.map(({ n, title, desc }) => (
              <div key={n} style={{ display: 'flex', gap: 12, paddingTop: 14 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--text)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        Representatives join on their own devices.
      </p>
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <button onClick={() => go('admin')} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>
          ⚙ Admin
        </button>
      </div>
    </div>
  )
}
