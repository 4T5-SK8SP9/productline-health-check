import { useState, useEffect, useRef } from 'react'
import { listenSession, submitVote, advanceQuestion, startRound2, sanitizeName,
  getVotesForRound, allMembersVoted, allVotesIdentical, getAverageScore, getRawAverage } from './firebaseHelpers.js'
import { ALL_QUESTIONS, TOTAL_QUESTIONS, CATEGORIES, CWRF_LABELS, CWRF_COLORS, CWRF_BGS, scoreToLabel } from './questions.js'

const SCORES = [1, 2, 3, 4]

function VoteDistribution({ votes, color }) {
  const scores = Object.values(votes).map(v => v.score)
  const counts = SCORES.map(v => ({ v, count: scores.filter(s => s === v).length }))
  const maxCount = Math.max(...counts.map(c => c.count), 1)
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 60, marginBottom: 8 }}>
      {counts.map(({ v, count }) => (
        <div key={v} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: count > 0 ? CWRF_COLORS[v-1] : 'var(--text3)' }}>{count > 0 ? count : ''}</div>
          <div style={{ width: '100%', background: count > 0 ? CWRF_COLORS[v-1] : 'var(--border)', borderRadius: '4px 4px 0 0', height: `${Math.max((count / maxCount) * 40, count > 0 ? 6 : 2)}px`, transition: 'height 0.4s ease', opacity: count > 0 ? 1 : 0.3 }} />
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{CWRF_LABELS[v-1]}</div>
        </div>
      ))}
    </div>
  )
}

export default function Voting({ sessionData, go }) {
  const { sessionId, memberName, role } = sessionData
  const [session, setSession] = useState(null)
  const [myVote, setMyVote] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [perfectAlignment, setPerfectAlignment] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [copied, setCopied] = useState(false)
  const prevKeyRef = useRef(null)
  const isFacilitator = role === 'facilitator'

  useEffect(() => {
    const unsub = listenSession(sessionId, data => {
      setSession(data)
      if (data.status === 'complete') { go('results', { finalSession: data }); return }

      const qIdx = data.currentQuestion ?? 0
      const round = data.currentRound ?? 1
      const key = `${qIdx}-${round}`

      if (prevKeyRef.current !== key) {
        prevKeyRef.current = key
        setMyVote(null)
        setRevealed(false)
        setPerfectAlignment(false)
        setAdvancing(false)
      }

      const voted = allMembersVoted(data, qIdx, round)
      if (voted && !revealed) {
        setRevealed(true)
        const identical = allVotesIdentical(data, qIdx, round)
        if (identical) {
          setPerfectAlignment(true)
          if (!advancing) {
            setAdvancing(true)
            setTimeout(() => advanceQuestion({ code: sessionId, nextIndex: qIdx + 1, totalQuestions: TOTAL_QUESTIONS }), 3000)
          }
        }
      }
    })
    return () => unsub()
  }, [sessionId, revealed, advancing])

  function copyJoinLink() {
    const base = window.location.origin + window.location.pathname
    const url = `${base}?join=${sessionId}`
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  if (!session) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text3)' }}>Connecting…</div>

  const qIdx = session.currentQuestion ?? 0
  const round = session.currentRound ?? 1
  const question = ALL_QUESTIONS[qIdx]
  const votes = getVotesForRound(session, qIdx, round)
  const members = Object.values(session.members || {})
  const votedCount = Object.keys(votes).length
  const totalCount = members.length
  const myKey = sanitizeName(memberName)
  const hasVoted = !!votes[myKey]
  const resultScore = getAverageScore(session, qIdx, round)
  const rawAverage = getRawAverage(session, qIdx, round)
  const cat = CATEGORIES.find(c => c.id === question.categoryId)
  const cwrfDescriptions = [question.crawl, question.walk, question.run, question.fly]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{session.teamName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{memberName} · Round {round} of 2</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={copyJoinLink} style={{ fontSize: 11, padding: '4px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: copied ? '#14532D' : 'var(--text3)' }}>
              {copied ? '✓ Link copied' : '+ Invite'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{qIdx + 1}/{TOTAL_QUESTIONS}</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: 'var(--border)' }}>
        <div style={{ height: '100%', background: cat?.color, width: `${(qIdx / TOTAL_QUESTIONS) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ flex: 1, maxWidth: 640, margin: '0 auto', width: '100%', padding: '1.5rem 1.25rem' }}>

        {/* Round indicator */}
        {round === 2 && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: '#9A3412', fontWeight: 500 }}>
            🔄 Round 2 — Rescore after discussion
          </div>
        )}

        {/* Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: cat?.color }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{question.categoryName}</span>
        </div>

        {/* Question */}
        <h2 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.35, marginBottom: '1.25rem' }}>{question.title}</h2>

        {/* CWRF Vote cards */}
        {!revealed && !(isFacilitator && !session.facilitatorVotes) && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, textAlign: 'center' }}>
              {hasVoted ? '✓ Vote submitted — waiting for others' : 'Select where you are today'}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {SCORES.map(v => {
                const label = CWRF_LABELS[v-1]
                const color = CWRF_COLORS[v-1]
                const bg = CWRF_BGS[v-1]
                const desc = cwrfDescriptions[v-1]
                const isSelected = myVote === v
                return (
                  <button
                    key={v}
                    onClick={() => { if (hasVoted) return; setMyVote(v); submitVote({ code: sessionId, memberName, questionIndex: qIdx, round, score: v }) }}
                    disabled={hasVoted}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 16px',
                      border: isSelected ? `2px solid ${color}` : '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? bg : 'var(--surface)',
                      cursor: hasVoted ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      transform: isSelected ? 'scale(1.01)' : 'scale(1)'
                    }}
                  >
                    <div style={{
                      minWidth: 52, height: 36, borderRadius: 6,
                      background: isSelected ? color : 'var(--surface2)',
                      border: `1.5px solid ${isSelected ? color : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      color: isSelected ? '#fff' : color,
                      letterSpacing: '0.04em', flexShrink: 0
                    }}>
                      <span style={{ fontSize: 9, opacity: 0.6, display: 'block' }}>{v}</span>{label.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: isSelected ? color : 'var(--text2)', lineHeight: 1.45, fontWeight: isSelected ? 500 : 400 }}>
                      {desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Waiting */}
        {!revealed && (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{votedCount} of {totalCount} voted</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {members.map((m, i) => {
                const voted = !!votes[sanitizeName(m.name)]
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: voted ? 'var(--accent)' : 'var(--text3)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: voted ? 'var(--accent)' : 'var(--border)' }} />
                    {m.name}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reveal */}
        {revealed && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {perfectAlignment && (
              <div style={{ textAlign: 'center', padding: '16px', background: '#F0FDF4', border: '2px solid #16A34A', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                <div style={{ fontSize: 20 }}>🎯</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#14532D', marginBottom: 4 }}>Perfect alignment!</div>
                <div style={{ fontSize: 13, color: '#166534' }}>Everyone chose {scoreToLabel(resultScore)} — moving to next question</div>
              </div>
            )}

            {!perfectAlignment && (
              <div style={{ background: 'var(--surface)', border: `2px solid ${cat?.color}`, borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>
                      {round === 1 ? 'Round 1 results' : 'Round 2 results — Final'}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: resultScore ? CWRF_COLORS[resultScore-1] : cat?.color }}>
                      Result: {scoreToLabel(resultScore)}
                      <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>
                        (avg {rawAverage?.toFixed(1)} → rounded down)
                      </span>
                    </div>
                  </div>
                </div>

                <VoteDistribution votes={votes} color={cat?.color} />

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {Object.values(votes).sort((a,b) => a.score - b.score).map((v, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '6px 10px', background: CWRF_BGS[v.score-1], border: `1px solid ${CWRF_COLORS[v.score-1]}`, borderRadius: 6, minWidth: 56 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: CWRF_COLORS[v.score-1] }}>{scoreToLabel(v.score)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{v.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isFacilitator && !perfectAlignment && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: '1rem' }}>
                {round === 1 ? (
                  <>
                    <button className="btn-primary" onClick={() => startRound2({ code: sessionId, questionIndex: qIdx })} style={{ background: cat?.color }}>
                      Start Round 2 →
                    </button>
                    <button className="btn-secondary" onClick={() => advanceQuestion({ code: sessionId, nextIndex: qIdx + 1, totalQuestions: TOTAL_QUESTIONS })}>
                      Skip Round 2
                    </button>
                  </>
                ) : (
                  <button className="btn-primary" onClick={() => advanceQuestion({ code: sessionId, nextIndex: qIdx + 1, totalQuestions: TOTAL_QUESTIONS })} style={{ gridColumn: '1/-1', background: cat?.color }}>
                    Next question →
                  </button>
                )}
              </div>
            )}

            {!isFacilitator && !perfectAlignment && (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: '1rem' }}>
                {round === 1 ? 'Discuss your scores — facilitator will start Round 2' : 'Waiting for facilitator to advance…'}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
