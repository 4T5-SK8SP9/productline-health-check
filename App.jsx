import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import { loadCategories, updateRuntimeCategories } from './questions.js'
import Home from './Home.jsx'
import CreateSession from './CreateSession.jsx'
import JoinSession from './JoinSession.jsx'
import Lobby from './Lobby.jsx'
import Voting from './Voting.jsx'
import Results from './Results.jsx'
import Admin from './Admin.jsx'

const SESSION_KEY = 'plhc_session'

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [sessionData, setSessionData] = useState(null)

  useEffect(() => {
    loadCategories(db).then(cats => {
      updateRuntimeCategories(cats)

      const params = new URLSearchParams(window.location.search)
      const joinCode = params.get('join')
      const isAdmin = window.location.pathname.includes('/admin') || params.get('admin') === '1'

      if (isAdmin) {
        setScreen('admin')
      } else if (joinCode) {
        setSessionData({ prefillCode: joinCode.toUpperCase() })
        setScreen('join')
      } else {
        // Restore session from sessionStorage if available
        try {
          const saved = sessionStorage.getItem(SESSION_KEY)
          if (saved) {
            const { screen: savedScreen, sessionData: savedData } = JSON.parse(saved)
            // Only restore if in an active session (not home/create/join)
            if (['lobby', 'voting'].includes(savedScreen) && savedData?.sessionId) {
              setSessionData(savedData)
              setScreen(savedScreen)
              return
            }
          }
        } catch (e) {
          // Ignore parse errors, fall through to home
        }
        setScreen('home')
      }
    })
  }, [])

  function go(targetScreen, data = {}) {
    setSessionData(prev => {
      const next = { ...prev, ...data }
      // Persist active session screens to survive reload
      if (['lobby', 'voting'].includes(targetScreen)) {
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ screen: targetScreen, sessionData: next }))
        } catch (e) {}
      } else {
        // Clear when leaving active session (home, results, admin)
        sessionStorage.removeItem(SESSION_KEY)
      }
      return next
    })
    setScreen(targetScreen)
  }

  const props = { sessionData, go }

  if (screen === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text3)', fontSize: 14 }}>
      Loading…
    </div>
  )

  return (
    <>
      {screen === 'home'    && <Home {...props} />}
      {screen === 'create'  && <CreateSession {...props} />}
      {screen === 'join'    && <JoinSession {...props} />}
      {screen === 'lobby'   && <Lobby {...props} />}
      {screen === 'voting'  && <Voting {...props} />}
      {screen === 'results' && <Results {...props} />}
      {screen === 'admin'   && <Admin {...props} />}
    </>
  )
}
