import { db } from './firebase.js'
import { ref, set, get, update, onValue, serverTimestamp } from 'firebase/database'

export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function getJoinUrl(code) {
  const base = window.location.origin + window.location.pathname
  return `${base}?join=${code}`
}

export async function createSession({ teamName, facilitatorName }) {
  const code = generateCode()
  const sessionRef = ref(db, `sessions/${code}`)
  await set(sessionRef, {
    teamName,
    facilitator: facilitatorName,
    status: 'lobby',
    currentQuestion: 0,
    currentRound: 1,
    createdAt: serverTimestamp(),
    members: {
      [sanitizeName(facilitatorName)]: {
        name: facilitatorName,
        joinedAt: serverTimestamp()
      }
    }
  })
  return code
}

export async function joinSession({ code, memberName }) {
  const sessionRef = ref(db, `sessions/${code}`)
  const snap = await get(sessionRef)
  if (!snap.exists()) throw new Error('Session not found')
  const session = snap.val()
  if (session.status === 'complete') throw new Error('This session has already ended')
  const key = sanitizeName(memberName)
  await update(ref(db, `sessions/${code}/members/${key}`), {
    name: memberName,
    joinedAt: serverTimestamp()
  })
  return session
}

export async function submitVote({ code, memberName, questionIndex, round, score }) {
  const key = sanitizeName(memberName)
  await update(ref(db, `sessions/${code}/votes/${questionIndex}/round${round}/${key}`), {
    score,
    name: memberName,
    submittedAt: serverTimestamp()
  })
}

export async function startRound2({ code, questionIndex }) {
  await update(ref(db, `sessions/${code}`), {
    status: 'voting',
    currentRound: 2,
    currentQuestion: questionIndex
  })
}

export async function advanceQuestion({ code, nextIndex, totalQuestions }) {
  if (nextIndex >= totalQuestions) {
    await update(ref(db, `sessions/${code}`), { status: 'complete', currentQuestion: nextIndex, currentRound: 1 })
  } else {
    await update(ref(db, `sessions/${code}`), { status: 'voting', currentQuestion: nextIndex, currentRound: 1 })
  }
}

export async function startSession(code) {
  await update(ref(db, `sessions/${code}`), { status: 'voting', currentQuestion: 0, currentRound: 1 })
}

export function listenSession(code, callback) {
  const sessionRef = ref(db, `sessions/${code}`)
  return onValue(sessionRef, snap => {
    if (snap.exists()) callback(snap.val())
  })
}

export function sanitizeName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
}

export function getVotesForRound(session, questionIndex, round) {
  return session?.votes?.[questionIndex]?.[`round${round}`] || {}
}

export function allMembersVoted(session, questionIndex, round) {
  const members = Object.keys(session?.members || {})
  const votes = getVotesForRound(session, questionIndex, round)
  const votedKeys = Object.keys(votes)
  return members.length > 0 && members.every(mk => votedKeys.includes(mk))
}

export function allVotesIdentical(session, questionIndex, round) {
  const votes = getVotesForRound(session, questionIndex, round)
  const scores = Object.values(votes).map(v => v.score)
  if (scores.length === 0) return false
  return scores.every(s => s === scores[0])
}

export function getLowestScore(session, questionIndex, round) {
  const votes = getVotesForRound(session, questionIndex, round)
  const scores = Object.values(votes).map(v => v.score)
  return scores.length ? Math.min(...scores) : null
}

export function getFinalScore(session, questionIndex) {
  const round2Votes = getVotesForRound(session, questionIndex, 2)
  const round1Votes = getVotesForRound(session, questionIndex, 1)
  if (Object.keys(round2Votes).length > 0) {
    return getLowestScore(session, questionIndex, 2)
  }
  return getLowestScore(session, questionIndex, 1)
}
