'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignOutButton({ className }) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <button onClick={handleSignOut} className={className}>
      Sign Out
    </button>
  );
}
