import { useState, useEffect } from 'react'
import { auth } from './firebase.js'
import {
  listenAuthState, loginAdmin, logoutAdmin, registerFirstAdmin,
  isAdmin, isSuperAdmin, listAdmins, inviteAdmin, removeAdmin,
  loadAdminCategories, saveCategories, resetToDefaults, generateId
} from './adminHelpers.js'

// ── Top-level Admin shell ─────────────────────────────────────────────────────
export default function Admin({ go }) {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [adminStatus, setAdminStatus] = useState(null)
  const [tab, setTab] = useState('questions')

  useEffect(() => {
    return listenAuthState(async u => {
      setUser(u)
      if (u) {
        const admin = await isAdmin(u.uid)
        const superAdmin = await isSuperAdmin(u.uid)
        setAdminStatus({ isAdmin: admin, isSuperAdmin: superAdmin })
      } else {
        setAdminStatus(null)
      }
    })
  }, [])

  if (user === undefined) return <LoadingScreen />
  if (!user || !adminStatus?.isAdmin) return <AdminLogin setUser={setUser} setAdminStatus={setAdminStatus} go={go} />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => go('home')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, cursor: 'pointer', padding: 0 }}>← App</button>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Admin Panel</span>
            {adminStatus.isSuperAdmin && <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Superadmin</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{user.email}</span>
            <button onClick={logoutAdmin} className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}>Sign out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
          {['questions', adminStatus.isSuperAdmin && 'admins'].filter(Boolean).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: tab === t ? 'var(--text)' : 'transparent', color: tab === t ? '#fff' : 'var(--text2)', textTransform: 'capitalize' }}>
              {t === 'questions' ? 'Questions & Categories' : 'Admin Users'}
            </button>
          ))}
        </div>

        {tab === 'questions' && <QuestionEditor />}
        {tab === 'admins' && adminStatus.isSuperAdmin && <AdminUsers currentUser={user} />}
      </div>
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text3)', fontSize: 14 }}>Loading…</div>
}

// ── Login ─────────────────────────────────────────────────────────────────────
function AdminLogin({ setUser, setAdminStatus, go }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // login | register
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return
    setLoading(true); setError('')
    try {
      if (mode === 'register') {
        const cred = await registerFirstAdmin(email.trim(), password)
        setUser(cred.user)
        setAdminStatus({ isAdmin: true, isSuperAdmin: true })
      } else {
        const cred = await loginAdmin(email.trim(), password)
        const admin = await isAdmin(cred.user.uid)
        if (!admin) { await logoutAdmin(); throw new Error('This account does not have admin access') }
        const superAdmin = await isSuperAdmin(cred.user.uid)
        setUser(cred.user)
        setAdminStatus({ isAdmin: true, isSuperAdmin: superAdmin })
      }
    } catch (e) {
      setError(e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim())
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ paddingTop: '3rem', maxWidth: 400 }}>
      <button onClick={() => go('home')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: '1.5rem' }}>← Back to app</button>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Team Health Check</div>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>{mode === 'login' ? 'Admin sign in' : 'Create first admin'}</h2>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '2rem', lineHeight: 1.5 }}>
        {mode === 'login' ? 'Sign in to manage questions and admin users.' : 'Register the first superadmin account for this tool.'}
      </p>
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
        <div><label className="label">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e => e.key === 'Enter' && handleSubmit()} /></div>
        <div><label className="label">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} /></div>
      </div>
      {error && <p style={{ fontSize: 13, color: '#B00020', marginBottom: '1rem', lineHeight: 1.4 }}>{error}</p>}
      <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginBottom: 12 }}>
        {loading ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create admin account →'}
      </button>
      <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text3)', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
        {mode === 'login' ? 'First time? Create admin account' : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}

// ── Question Editor ───────────────────────────────────────────────────────────
function QuestionEditor() {
  const [categories, setCategories] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedCat, setExpandedCat] = useState(null)
  const [editingQ, setEditingQ] = useState(null) // { catId, qId } or null
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)

  useEffect(() => { loadAdminCategories().then(setCategories) }, [])

  async function handleSave() {
    setSaving(true)
    await saveCategories(categories)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleReset() {
    await resetToDefaults()
    const cats = await loadAdminCategories()
    setCategories(cats)
    setShowResetConfirm(false)
  }

  function updateQuestion(catId, qId, field, value) {
    setCategories(prev => prev.map(cat =>
      cat.id !== catId ? cat : { ...cat, questions: cat.questions.map(q => q.id !== qId ? q : { ...q, [field]: value }) }
    ))
  }

  function moveQuestion(catId, qId, dir) {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat
      const idx = cat.questions.findIndex(q => q.id === qId)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= cat.questions.length) return cat
      const updated = [...cat.questions]
      ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
      return { ...cat, questions: updated }
    }))
  }

  function deleteQuestion(catId, qId) {
    setCategories(prev => prev.map(cat =>
      cat.id !== catId ? cat : { ...cat, questions: cat.questions.filter(q => q.id !== qId) }
    ))
  }

  function addQuestion(catId) {
    const newQ = { id: generateId('q'), title: '', negative: '', positive: '' }
    setCategories(prev => prev.map(cat => cat.id !== catId ? cat : { ...cat, questions: [...cat.questions, newQ] }))
    setEditingQ({ catId, qId: newQ.id })
  }

  function updateCategoryName(catId, name) {
    setCategories(prev => prev.map(cat => cat.id !== catId ? cat : { ...cat, name }))
  }

  function updateCategoryColor(catId, color) {
    setCategories(prev => prev.map(cat => cat.id !== catId ? cat : { ...cat, color }))
  }

  function deleteCategory(catId) {
    if (categories.length <= 1) return
    setCategories(prev => prev.filter(cat => cat.id !== catId))
  }

  function addCategory() {
    if (!newCatName.trim()) return
    const newCat = { id: generateId('cat'), name: newCatName.trim(), color: '#374151', order: categories.length, questions: [] }
    setCategories(prev => [...prev, newCat])
    setNewCatName(''); setShowNewCat(false)
    setExpandedCat(newCat.id)
  }

  function moveCat(catId, dir) {
    const idx = categories.findIndex(c => c.id === catId)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= categories.length) return
    const updated = [...categories]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    setCategories(updated)
  }

  if (!categories) return <div style={{ color: 'var(--text3)', fontSize: 14 }}>Loading questions…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Questions & Categories</h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{categories.reduce((sum, c) => sum + c.questions.length, 0)} questions across {categories.length} categories</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowResetConfirm(true)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>Restore defaults</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ fontSize: 12, padding: '6px 16px', minWidth: 80 }}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#7F1D1D', marginBottom: 8 }}>Reset all questions to defaults?</div>
          <div style={{ fontSize: 12, color: '#991B1B', marginBottom: 10 }}>This will overwrite all custom questions and categories.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleReset} style={{ padding: '5px 14px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Yes, reset</button>
            <button onClick={() => setShowResetConfirm(false)} className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}>Cancel</button>
          </div>
        </div>
      )}

      {categories.map((cat, catIdx) => (
        <div key={cat.id} style={{ marginBottom: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          {/* Category header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: expandedCat === cat.id ? '1px solid var(--border)' : 'none' }}>
            <input type="color" value={cat.color} onChange={e => updateCategoryColor(cat.id, e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none' }} title="Category colour" />
            <input value={cat.name} onChange={e => updateCategoryName(cat.id, e.target.value)} style={{ flex: 1, fontSize: 14, fontWeight: 500, border: 'none', background: 'transparent', padding: '4px 0', outline: 'none', color: 'var(--text)' }} />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{cat.questions.length} q</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => moveCat(cat.id, -1)} disabled={catIdx === 0} style={{ padding: '2px 6px', background: 'none', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, cursor: 'pointer', opacity: catIdx === 0 ? 0.3 : 1 }}>↑</button>
              <button onClick={() => moveCat(cat.id, 1)} disabled={catIdx === categories.length - 1} style={{ padding: '2px 6px', background: 'none', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, cursor: 'pointer', opacity: catIdx === categories.length - 1 ? 0.3 : 1 }}>↓</button>
              <button onClick={() => deleteCategory(cat.id)} style={{ padding: '2px 8px', background: 'none', border: '1px solid #FECACA', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: '#DC2626' }} title="Delete category">✕</button>
              <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} style={{ padding: '2px 10px', background: expandedCat === cat.id ? 'var(--text)' : 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: expandedCat === cat.id ? '#fff' : 'var(--text2)' }}>
                {expandedCat === cat.id ? 'Close' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Questions */}
          {expandedCat === cat.id && (
            <div style={{ padding: '12px 16px' }}>
              {cat.questions.map((q, qi) => (
                <div key={q.id} style={{ marginBottom: 10, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>Question {qi + 1}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button onClick={() => moveQuestion(cat.id, q.id, -1)} disabled={qi === 0} style={{ padding: '1px 5px', background: 'none', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10, cursor: 'pointer', opacity: qi === 0 ? 0.3 : 1 }}>↑</button>
                        <button onClick={() => moveQuestion(cat.id, q.id, 1)} disabled={qi === cat.questions.length - 1} style={{ padding: '1px 5px', background: 'none', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10, cursor: 'pointer', opacity: qi === cat.questions.length - 1 ? 0.3 : 1 }}>↓</button>
                      </div>
                    </div>
                    <button onClick={() => deleteQuestion(cat.id, q.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 13 }} title="Delete question">✕</button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Question title</label>
                      <input value={q.title} onChange={e => updateQuestion(cat.id, q.id, 'title', e.target.value)} placeholder="e.g. How well do we communicate?" style={{ fontSize: 13 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#DC2626', display: 'block', marginBottom: 3 }}>Score 1 (negative extreme)</label>
                        <textarea value={q.negative} onChange={e => updateQuestion(cat.id, q.id, 'negative', e.target.value)} rows={3} style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: '1.5px solid #FECACA', borderRadius: 6, fontFamily: 'var(--font)', background: '#FEF2F2', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#16A34A', display: 'block', marginBottom: 3 }}>Score 5 (positive extreme)</label>
                        <textarea value={q.positive} onChange={e => updateQuestion(cat.id, q.id, 'positive', e.target.value)} rows={3} style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: '1.5px solid #BBF7D0', borderRadius: 6, fontFamily: 'var(--font)', background: '#F0FDF4', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => addQuestion(cat.id)} style={{ width: '100%', padding: '8px 0', background: 'none', border: `1.5px dashed ${cat.color}`, borderRadius: 'var(--radius-sm)', fontSize: 13, color: cat.color, cursor: 'pointer', fontWeight: 500 }}>
                + Add question
              </button>
            </div>
          )}
        </div>
      ))}

      {showNewCat ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" onKeyDown={e => e.key === 'Enter' && addCategory()} style={{ flex: 1, fontSize: 13 }} autoFocus />
          <button onClick={addCategory} className="btn-primary" style={{ fontSize: 13, padding: '0 16px' }}>Add</button>
          <button onClick={() => { setShowNewCat(false); setNewCatName('') }} className="btn-secondary" style={{ fontSize: 13, padding: '0 12px' }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowNewCat(true)} style={{ width: '100%', padding: '10px 0', background: 'none', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text3)', cursor: 'pointer', marginTop: 4 }}>
          + Add category
        </button>
      )}
    </div>
  )
}

// ── Admin Users ───────────────────────────────────────────────────────────────
function AdminUsers({ currentUser }) {
  const [admins, setAdmins] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { listAdmins().then(setAdmins) }, [])

  async function handleInvite() {
    if (!email.trim() || !password.trim()) return
    setLoading(true); setError(''); setSuccess('')
    try {
      await inviteAdmin(email.trim(), password, currentUser.uid)
      setSuccess(`Admin account created for ${email.trim()}`)
      setEmail(''); setPassword('')
      listAdmins().then(setAdmins)
    } catch (e) {
      setError(e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim())
    }
    setLoading(false)
  }

  async function handleRemove(uid) {
    try {
      await removeAdmin(uid, currentUser.uid)
      setAdmins(prev => prev.filter(a => a.uid !== uid))
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '1.25rem' }}>Admin Users</h3>

      {/* Current admins */}
      <div style={{ marginBottom: '1.5rem' }}>
        {admins.map(admin => (
          <div key={admin.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: admin.role === 'superadmin' ? '#FEF3C7' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: admin.role === 'superadmin' ? '#92400E' : 'var(--text2)' }}>
              {admin.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{admin.email}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{admin.role}</div>
            </div>
            {admin.uid === currentUser.uid ? (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>you</span>
            ) : (
              <button onClick={() => handleRemove(admin.uid)} style={{ padding: '4px 10px', background: 'none', border: '1px solid #FECACA', borderRadius: 6, fontSize: 12, color: '#DC2626', cursor: 'pointer' }}>Remove</button>
            )}
          </div>
        ))}
      </div>

      {/* Invite form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Invite new admin</div>
        <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
          <div><label className="label">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com" /></div>
          <div><label className="label">Temporary password</label><input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="They can change this after signing in" /></div>
        </div>
        {error && <p style={{ fontSize: 12, color: '#B00020', marginBottom: 10 }}>{error}</p>}
        {success && <p style={{ fontSize: 12, color: '#16A34A', marginBottom: 10 }}>{success}</p>}
        <button onClick={handleInvite} disabled={loading || !email.trim() || !password.trim()} className="btn-primary" style={{ fontSize: 13 }}>
          {loading ? 'Creating…' : 'Create admin account'}
        </button>
      </div>
    </div>
  )
}
