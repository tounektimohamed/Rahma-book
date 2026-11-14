import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, validateFirestoreConnection } from '../firebase/firebase';
import { isSingleAuthorizedAdmin } from '../utils/adminSecurity';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminChecking: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAdminWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecking, setAdminChecking] = useState(true);

  useEffect(() => {
    let active = true;
    let checkId = 0;

    validateFirestoreConnection();
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentCheck = ++checkId;
      if (!active) return;

      setUser(firebaseUser);
      setAuthReady(true);
      setAdminChecking(true);

      const allowed = await isSingleAuthorizedAdmin(
        firebaseUser?.email,
        firebaseUser?.emailVerified
      );
      if (!active || currentCheck !== checkId) return;

      setIsAdmin(allowed);
      setAdminChecking(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInAdminWithGoogle = async () => {
    const adminProvider = new GoogleAuthProvider();
    adminProvider.setCustomParameters({
      prompt: 'select_account',
    });
    await signInWithPopup(auth, adminProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        adminChecking,
        signInWithGoogle,
        signInAdminWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
