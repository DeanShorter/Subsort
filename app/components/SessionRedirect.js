'use client';
import { useEffect } from 'react';

export default function SessionRedirect() {
  useEffect(() => {
    // Quick check: if Supabase has a stored session, redirect to dashboard
    // This avoids requiring the full AuthProvider on the landing page
    try {
      const stored = localStorage.getItem('sb-cruqcglooudetpxstvsc-auth-token');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.access_token && parsed?.expires_at) {
          // Check token hasn't expired
          const expiresAt = parsed.expires_at * 1000; // seconds to ms
          if (Date.now() < expiresAt) {
            window.location.href = '/dashboard';
          }
        }
      }
    } catch (e) {
      // Ignore — no session or invalid data
    }
  }, []);

  return null;
}
