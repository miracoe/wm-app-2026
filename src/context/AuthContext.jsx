import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
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
