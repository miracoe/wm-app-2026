import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  setDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

// ─── Users ──────────────────────────────────────────────────────────────────

export const getLeaderboard = (callback) => {
  const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'), orderBy('displayName', 'asc'))
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d, i) => ({ ...d.data(), rank: i + 1 }))
    callback(users)
  })
}

export const getUserDoc = (uid) => getDoc(doc(db, 'users', uid))

export const getAllUsers = () => getDocs(collection(db, 'users'))

// ─── Matches ────────────────────────────────────────────────────────────────

export const getMatches = (callback) => {
  const q = query(collection(db, 'matches'), orderBy('kickoff', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export const updateMatch = (id, data) => updateDoc(doc(db, 'matches', id), data)

// ─── Tips ───────────────────────────────────────────────────────────────────

export const setTip = (matchId, uid, tip) =>
  setDoc(doc(db, 'matches', matchId, 'tips', uid), {
    ...tip, uid, submittedAt: serverTimestamp(),
  })

export const getMatchTips = (matchId) =>
  getDocs(collection(db, 'matches', matchId, 'tips'))

export const getUserTipsForMatch = (matchId, uid, callback) =>
  onSnapshot(doc(db, 'matches', matchId, 'tips', uid), (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })

export const getAllTipsForMatch = (matchId, callback) => {
  const q = collection(db, 'matches', matchId, 'tips')
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data()))
  })
}

// ─── Reactions ──────────────────────────────────────────────────────────────

export const getReactions = (matchId, callback) => {
  const q = query(collection(db, 'matches', matchId, 'reactions'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export const addReaction = (matchId, data) =>
  addDoc(collection(db, 'matches', matchId, 'reactions'), {
    ...data, createdAt: serverTimestamp(),
  })

export const deleteReaction = (matchId, reactionId) =>
  deleteDoc(doc(db, 'matches', matchId, 'reactions', reactionId))

// ─── Bonus Tips ─────────────────────────────────────────────────────────────

export const getBonusTips = (uid, callback) =>
  onSnapshot(doc(db, 'bonusTips', uid), (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })

export const setBonusTip = (uid, data) =>
  setDoc(doc(db, 'bonusTips', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true })

export const getAllBonusTips = () => getDocs(collection(db, 'bonusTips'))
