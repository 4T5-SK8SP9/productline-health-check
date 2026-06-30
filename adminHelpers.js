import { db, auth } from './firebase.js'
import { ref, set, get, update, remove, onValue } from 'firebase/database'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { DEFAULT_CATEGORIES } from './questions.js'

// ── Auth ──────────────────────────────────────────────────────────────────────

export function listenAuthState(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logoutAdmin() {
  return signOut(auth)
}

export async function registerFirstAdmin(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await set(ref(db, `admins/${cred.user.uid}`), { email, role: 'superadmin', createdAt: Date.now() })
  // Seed default questions on first setup
  await seedDefaultQuestions()
  return cred
}

export async function isAdmin(uid) {
  const snap = await get(ref(db, `admins/${uid}`))
  return snap.exists()
}

export async function isSuperAdmin(uid) {
  const snap = await get(ref(db, `admins/${uid}`))
  if (!snap.exists()) return false
  return snap.val().role === 'superadmin'
}

// ── Admin management ──────────────────────────────────────────────────────────

export async function listAdmins() {
  const snap = await get(ref(db, 'admins'))
  if (!snap.exists()) return []
  return Object.entries(snap.val()).map(([uid, data]) => ({ uid, ...data }))
}

export async function inviteAdmin(email, password, currentUserUid) {
  const superCheck = await isSuperAdmin(currentUserUid)
  if (!superCheck) throw new Error('Only superadmins can invite new admins')
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await set(ref(db, `admins/${cred.user.uid}`), { email, role: 'admin', createdAt: Date.now(), invitedBy: currentUserUid })
  // Re-sign in the current admin (creating a new user signs them out)
  return cred.user.uid
}

export async function removeAdmin(uid, currentUserUid) {
  if (uid === currentUserUid) throw new Error('You cannot remove yourself')
  const superCheck = await isSuperAdmin(currentUserUid)
  if (!superCheck) throw new Error('Only superadmins can remove admins')
  await remove(ref(db, `admins/${uid}`))
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function loadAdminCategories() {
  const snap = await get(ref(db, 'config/categories'))
  if (snap.exists()) {
    return Object.values(snap.val()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }
  return DEFAULT_CATEGORIES
}

export async function saveCategories(categories) {
  const obj = {}
  categories.forEach((cat, i) => { obj[cat.id] = { ...cat, order: i } })
  await set(ref(db, 'config/categories'), obj)
}

export async function seedDefaultQuestions() {
  await saveCategories(DEFAULT_CATEGORIES)
}

export async function resetToDefaults() {
  await seedDefaultQuestions()
}

export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
