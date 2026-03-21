'use client';
import { createContext, useContext } from 'react';

export const AuthContext = createContext({
  user: null,
  accessToken: null,
  userTier: 'free',
  loading: true,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);
