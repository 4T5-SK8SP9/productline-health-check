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

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [sessionData, setSessionData] = useState(null)

  useEffect(() => {
    // Load questions from Firebase (with default fallback)
    loadCategories(db).then(cats => {
      updateRuntimeCategories(cats)

      // Check URL params
      const params = new URLSearchParams(window.location.search)
      const joinCode = params.get('join')
      const isAdmin = window.location.pathname.includes('/admin') || params.get('admin') === '1'

      if (isAdmin) {
        setScreen('admin')
      } else if (joinCode) {
        setSessionData({ prefillCode: joinCode.toUpperCase() })
        setScreen('join')
      } else {
        setScreen('home')
      }
    })
  }, [])

  function go(screen, data = {}) {
    setSessionData(prev => ({ ...prev, ...data }))
    setScreen(screen)
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
