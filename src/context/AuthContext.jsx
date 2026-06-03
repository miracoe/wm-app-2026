import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        await ensureUserDoc(firebaseUser)
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        const data = userSnap.data()
        setUserData(data)
        setIsAdmin(data?.isAdmin === true)
      } else {
        setUser(null)
        setUserData(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function ensureUserDoc(firebaseUser) {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        totalPoints: 0,
        currentRank: 99,
        lastRank: 99,
        jokersLeft: 3,
        insuranceLeft: 1,
        allInLeft: 1,
        spionageLeft: 2,
        badges: [],
        currentStreak: 0,
        bestStreak: 0,
        hasMomentum: false,
        h2h: {},
        stats: { correctTips: 0, wrongTips: 0, highestOddsWon: 0 },
        createdAt: serverTimestamp(),
      })
    } else {
      // Patch missing fields for existing users
      const data = snap.data()
      const patch = {}
      if (data.allInLeft === undefined) patch.allInLeft = 1
      if (data.spionageLeft === undefined) patch.spionageLeft = 2
      if (data.currentStreak === undefined) patch.currentStreak = 0
      if (data.bestStreak === undefined) patch.bestStreak = 0
      if (data.hasMomentum === undefined) patch.hasMomentum = false
      if (data.h2h === undefined) patch.h2h = {}
      if (Object.keys(patch).length > 0) await updateDoc(ref, patch)
    }
  }

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, userData, loading, loginWithGoogle, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
