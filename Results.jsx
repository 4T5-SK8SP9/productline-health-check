import { useState, useRef } from 'react'
import { CATEGORIES, ALL_QUESTIONS } from './questions.js'
import { getFinalScore } from './firebaseHelpers.js'

function computeCategoryScores(session) {
  const results = {}
  CATEGORIES.forEach(cat => {
    const scores = cat.questions.map(q => {
      const qIdx = ALL_QUESTIONS.findIndex(aq => aq.id === q.id)
      return getFinalScore(session, qIdx)
    }).filter(s => s !== null)
    results[cat.id] = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
  })
  return results
}

function ScoreBar({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 7, background: '#E5E5E5', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${(value / 5) * 100}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 500, minWidth: 28 }}>{value.toFixed(1)}</span>
    </div>
  )
}

function buildSessionSnapshot(session, catScores, allQuestionScores, overall, dateStr, members) {
  return {
    version: 1,
    teamName: session.teamName,
    date: dateStr,
    members: members,
    overallScore: overall ? parseFloat(overall.toFixed(2)) : null,
    categoryScores: Object.fromEntries(
      CATEGORIES.map(cat => [cat.id, catScores[cat.id] ? parseFloat(catScores[cat.id].toFixed(2)) : null])
    ),
    questionScores: Object.fromEntries(
      allQuestionScores.map(q => [q.id, q.score])
    )
  }
}

export default function Results({ sessionData, go }) {
  const session = sessionData?.finalSession
  const [showAllVotes, setShowAllVotes] = useState(false)
  const [prevSnapshot, setPrevSnapshot] = useState(null)
  const [loadError, setLoadError] = useState('')
  const fileInputRef = useRef(null)

  if (!session) return null

  const catScores = computeCategoryScores(session)
  const allVals = Object.values(catScores).filter(s => s !== null)
  const overall = allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : null
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const members = Object.values(session.members || {}).map(m => m.name)
  const allQuestionScores = ALL_QUESTIONS.map((q, qIdx) => ({
    ...q,
    score: getFinalScore(session, qIdx),
    round1Votes: session.votes?.[qIdx]?.round1 || {},
    round2Votes: session.votes?.[qIdx]?.round2 || {}
  }))
  const lowScores = allQuestionScores.filter(q => q.score !== null && q.score <= 2)
  const snapshot = buildSessionSnapshot(session, catScores, allQuestionScores, overall, dateStr, members)

  function getDelta(q) {
    if (!prevSnapshot) return null
    const prev = prevSnapshot.questionScores?.[q.id]
    if (prev == null || q.score == null) return null
    return q.score - prev
  }

  function getCatDelta(cat) {
    if (!prevSnapshot) return null
    const prev = prevSnapshot.categoryScores?.[cat.id]
    const curr = catScores[cat.id]
    if (prev == null || curr == null) return null
    return curr - prev
  }

  function getOverallDelta() {
    if (!prevSnapshot || overall == null) return null
    const prev = prevSnapshot.overallScore
    if (prev == null) return null
    return overall - prev
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.version || !data.questionScores) throw new Error('Invalid file')
        setPrevSnapshot(data)
        setLoadError('')
      } catch {
        setLoadError('Could not read file — make sure it is a valid session .json file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-health-${session.teamName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    const printWindow = window.open('', '_blank')
    const html = generatePrintHTML(session, catScores, allQuestionScores, overall, dateStr, members, prevSnapshot, lowScores, getDelta, getCatDelta, getOverallDelta())
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print() }, 600)
  }

  const overallDelta = getOverallDelta()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{session.teamName}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{dateStr} · {members.length} participants</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{members.join(', ')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={exportPDF} style={{ fontSize: 12, padding: '7px 14px' }}>↓ PDF</button>
            <button className="btn-secondary" onClick={downloadJSON} style={{ fontSize: 12, padding: '7px 14px' }}>↓ Save data</button>
            <button className="btn-primary" onClick={() => go('home')} style={{ fontSize: 12, padding: '7px 14px' }}>New session</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>

        {/* Post-session guide */}
        <details style={{ marginBottom: '1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <summary style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📋 What to do after this session</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>tap to expand</span>
          </summary>
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {[
                { step: '1', title: 'Save the session data', desc: 'Click "↓ Save data" to download a .json file. This is your record for next time — without it you cannot compare results.', action: 'Save to your team SharePoint or shared folder.' },
                { step: '2', title: 'Save the PDF report', desc: 'Click "↓ PDF" to download a printable report with all scores and focus areas.', action: 'Share with your team and any relevant stakeholders.' },
                { step: '3', title: 'Review the transcription', desc: 'If you recorded the session, review the discussion around low-scoring questions — that is where the real insights are.', action: 'Note key themes and share back to the team.' },
                { step: '4', title: 'Pick 1–2 focus areas', desc: 'Do not try to fix everything at once. Choose the 1–2 lowest scoring questions that the team has energy to work on.', action: 'Create a concrete action with an owner and a date.' },
                { step: '5', title: 'Schedule the next check-in', desc: 'The value comes from tracking progress over time. We recommend running the check-in every 6–8 weeks.', action: 'Book it in the calendar before you leave this session.' },
                { step: '6', title: 'Next time — load your .json file', desc: 'When you run the next session, upload your saved .json file on the results screen to see ▲▼ score changes automatically.', action: 'Keep all .json files in your SharePoint folder.' },
              ].map(({ step, title, desc, action }) => (
                <div key={step} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text)', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{step}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 3 }}>{desc}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>→ {action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Load previous session */}
        <div style={{ marginBottom: '1.25rem', padding: '14px 16px', background: prevSnapshot ? '#F0FDF4' : 'var(--surface)', border: `1px solid ${prevSnapshot ? '#BBF7D0' : 'var(--border)'}`, borderRadius: 'var(--radius)' }}>
          {prevSnapshot ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#14532D' }}>✓ Comparing with previous session</div>
                <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>{prevSnapshot.teamName} · {prevSnapshot.date} · {prevSnapshot.members?.length} participants</div>
              </div>
              <button onClick={() => setPrevSnapshot(null)} style={{ fontSize: 12, color: '#166534', background: 'none', border: '1px solid #BBF7D0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Remove</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Compare with a previous session</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.5 }}>
                Upload a <code style={{ background: 'var(--surface2)', padding: '1px 4px', borderRadius: 3 }}>.json</code> file saved from a previous session to see ▲▼ score changes.
              </div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>
                Upload previous session →
              </button>
              {loadError && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 8 }}>{loadError}</div>}
            </div>
          )}
        </div>

        {/* Overall */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '1.25rem' }}>
          <div style={{ textAlign: 'center', minWidth: 72 }}>
            <div style={{ fontSize: 42, fontWeight: 600, lineHeight: 1 }}>{overall?.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>/ 5.0</div>
            {overallDelta !== null && (
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: overallDelta > 0 ? '#16A34A' : overallDelta < 0 ? '#DC2626' : 'var(--text3)' }}>
                {overallDelta > 0 ? `▲ ${overallDelta.toFixed(1)}` : `▼ ${Math.abs(overallDelta).toFixed(1)}`}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Overall team health</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const delta = getCatDelta(cat)
                return catScores[cat.id] !== null && (
                  <div key={cat.id}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{cat.name}</span>
                      {delta !== null && <span style={{ color: delta > 0 ? '#16A34A' : delta < 0 ? '#DC2626' : 'var(--text3)', fontWeight: 600 }}>{delta > 0 ? `▲${delta.toFixed(1)}` : `▼${Math.abs(delta).toFixed(1)}`}</span>}
                    </div>
                    <ScoreBar value={catScores[cat.id]} color={cat.color} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Focus areas */}
        {lowScores.length > 0 && (
          <div style={{ padding: '14px 18px', background: '#FEF9EC', border: '1px solid #FDE68A', borderRadius: 'var(--radius)', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#92400E', marginBottom: 8 }}>
              🎯 {lowScores.length} area{lowScores.length > 1 ? 's' : ''} to focus on (score ≤ 2)
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {lowScores.map(q => {
                const delta = getDelta(q)
                return (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>{q.title}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {delta !== null && <span style={{ fontSize: 11, fontWeight: 600, color: delta > 0 ? '#16A34A' : '#DC2626' }}>{delta > 0 ? `▲${delta.toFixed(1)}` : `▼${Math.abs(delta).toFixed(1)}`}</span>}
                      <span style={{ fontWeight: 600, color: '#DC2626' }}>{q.score}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Questions by category */}
        {CATEGORIES.map(cat => (
          <div key={cat.id} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: cat.color }} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</span>
              {catScores[cat.id] !== null && <span style={{ fontSize: 12, color: 'var(--text3)' }}>avg {catScores[cat.id].toFixed(1)}</span>}
              {getCatDelta(cat) !== null && <span style={{ fontSize: 12, fontWeight: 600, color: getCatDelta(cat) > 0 ? '#16A34A' : '#DC2626' }}>{getCatDelta(cat) > 0 ? `▲${getCatDelta(cat).toFixed(1)}` : `▼${Math.abs(getCatDelta(cat)).toFixed(1)}`}</span>}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {cat.questions.map(q => {
                const qData = allQuestionScores.find(aq => aq.id === q.id)
                const delta = getDelta(qData)
                const isLow = qData?.score !== null && qData?.score <= 2
                const hasRound2 = qData && Object.keys(qData.round2Votes).length > 0
                return (
                  <div key={q.id} style={{ padding: '10px 14px', background: isLow ? '#FEF2F2' : 'var(--surface)', border: `1px solid ${isLow ? '#FECACA' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.3 }}>{q.title}</div>
                      {delta !== null && <span style={{ fontSize: 11, fontWeight: 600, color: delta > 0 ? '#16A34A' : '#DC2626', minWidth: 36, textAlign: 'right' }}>{delta > 0 ? `▲${delta.toFixed(1)}` : `▼${Math.abs(delta).toFixed(1)}`}</span>}
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[1,2,3,4,5].map(v => <div key={v} style={{ width: 14, height: 14, borderRadius: 3, background: v <= (qData?.score || 0) ? cat.color : 'var(--surface2)' }} />)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, color: isLow ? '#DC2626' : 'var(--text)' }}>{qData?.score ?? '—'}</span>
                    </div>
                    {hasRound2 && showAllVotes && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>
                        <span style={{ fontWeight: 500 }}>R1:</span> {Object.values(qData.round1Votes).map(v => v.score).sort((a,b) => a-b).join(', ')} &nbsp;
                        <span style={{ fontWeight: 500 }}>R2:</span> {Object.values(qData.round2Votes).map(v => v.score).sort((a,b) => a-b).join(', ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <button className="btn-secondary" onClick={() => setShowAllVotes(v => !v)} style={{ width: '100%', marginTop: '0.5rem', fontSize: 13 }}>
          {showAllVotes ? 'Hide' : 'Show'} round scores per question
        </button>

        {prevSnapshot && (
          <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text3)' }}>
            Compared to: {prevSnapshot.teamName} · {prevSnapshot.date}
          </div>
        )}
      </div>
    </div>
  )
}

function generatePrintHTML(session, catScores, allQuestionScores, overall, dateStr, members, prevSnapshot, lowScores, getDelta, getCatDelta, overallDelta) {
  function deltaHtml(delta) {
    if (delta === null || delta === undefined) return ''
    if (delta > 0) return ` <span style="color:#16A34A;font-weight:600;font-size:11px;">▲${delta.toFixed(1)}</span>`
    if (delta < 0) return ` <span style="color:#DC2626;font-weight:600;font-size:11px;">▼${Math.abs(delta).toFixed(1)}</span>`
    return ''
  }

  function scoreBlocks(score, color) {
    return [1,2,3,4,5].map(v =>
      `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${v <= score ? (color || '#374151') : '#E5E7EB'};margin-right:2px;"></span>`
    ).join('')
  }

  const catRows = CATEGORIES.map(cat => {
    const avg = catScores[cat.id]
    const delta = getCatDelta(cat)
    const pct = avg ? (avg / 5) * 100 : 0
    return `<div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;border-radius:2px;background:${cat.color};"></div><span style="font-size:12px;color:#6B7280;">${cat.name}</span></div>
        <span style="font-size:12px;font-weight:600;">${avg?.toFixed(1) ?? '—'}${deltaHtml(delta)}</span>
      </div>
      <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${cat.color};border-radius:4px;"></div></div>
    </div>`
  }).join('')

  const questionRows = CATEGORIES.map(cat => {
    const avg = catScores[cat.id]
    const qs = cat.questions.map(q => {
      const qData = allQuestionScores.find(aq => aq.id === q.id)
      const delta = getDelta(qData)
      const isLow = qData?.score !== null && qData?.score <= 2
      return `<tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:8px 10px;font-size:12px;color:${isLow ? '#DC2626' : '#374151'};line-height:1.4;">${q.title}</td>
        <td style="padding:8px 10px;text-align:center;">${scoreBlocks(qData?.score || 0, cat.color)}</td>
        <td style="padding:8px 10px;text-align:center;font-size:13px;font-weight:600;color:${isLow ? '#DC2626' : '#111827'};">${qData?.score ?? '—'}${deltaHtml(delta)}</td>
      </tr>`
    }).join('')
    return `<div style="margin-bottom:20px;break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#F9FAFB;border-radius:6px 6px 0 0;border:1px solid #E5E7EB;border-bottom:none;">
        <div style="width:10px;height:10px;border-radius:2px;background:${cat.color};"></div>
        <span style="font-size:13px;font-weight:600;">${cat.name}</span>
        <span style="font-size:12px;color:#9CA3AF;margin-left:auto;">avg ${avg?.toFixed(1) ?? '—'}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-top:none;">${qs}</table>
    </div>`
  }).join('')

  const focusHtml = lowScores.length > 0 ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:14px 16px;margin-bottom:20px;break-inside:avoid;">
    <div style="font-size:13px;font-weight:600;color:#92400E;margin-bottom:8px;">Focus areas (score 2 or below)</div>
    ${lowScores.map(q => `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>${q.title}</span><span style="font-weight:700;color:#DC2626;">${q.score}${deltaHtml(getDelta(q))}</span></div>`).join('')}
  </div>` : ''

  const comparedTo = prevSnapshot ? `<div style="font-size:11px;color:#9CA3AF;margin-top:16px;padding-top:12px;border-top:1px solid #F3F4F6;">Compared to: ${prevSnapshot.teamName} · ${prevSnapshot.date} · ${prevSnapshot.members?.length} participants</div>` : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Team Health — ${session.teamName}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;background:white;padding:32px;}@media print{body{padding:0;}@page{margin:20mm 16mm;size:A4;}.no-print{display:none!important;}}</style>
  </head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #111827;">
    <div>
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;color:#9CA3AF;text-transform:uppercase;margin-bottom:4px;">Team Health Check</div>
      <div style="font-size:24px;font-weight:700;">${session.teamName}</div>
      <div style="font-size:13px;color:#6B7280;margin-top:4px;">${dateStr}</div>
      <div style="font-size:12px;color:#9CA3AF;margin-top:2px;">Participants: ${members.join(', ')}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#9CA3AF;margin-bottom:2px;">Overall score</div>
      <div style="font-size:40px;font-weight:700;line-height:1;">${overall?.toFixed(1) ?? '—'}${deltaHtml(overallDelta)}</div>
      <div style="font-size:13px;color:#9CA3AF;">/ 5.0</div>
    </div>
  </div>
  <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:20px;break-inside:avoid;">
    <div style="font-size:13px;font-weight:600;margin-bottom:12px;">Category Summary</div>${catRows}
  </div>
  ${focusHtml}${questionRows}${comparedTo}
  <div class="no-print" style="margin-top:24px;text-align:center;"><button onclick="window.print()" style="padding:10px 24px;background:#111827;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer;">Print / Save as PDF</button></div>
  </body></html>`
}
