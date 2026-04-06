'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthProvider } from '../components/AuthProvider';
import { useAuth } from '../components/AuthContext';
import { ChannelDataProvider } from '../components/ChannelDataProvider';
import OnboardingFlow from '../components/OnboardingFlow';

function OnboardingInner() {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check if user already has a profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        window.location.href = '/home';
      } else {
        setNeedsOnboarding(true);
      }
      setChecked(true);
    })();
  }, [user]);

  const handleComplete = () => {
    window.location.href = '/home';
  };

  if (!checked || !needsOnboarding) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
        {!checked && <span className="spinner" />}
      </div>
    );
  }

  return (
    <ChannelDataProvider user={user}>
      <OnboardingFlow visible={true} onComplete={handleComplete} />
    </ChannelDataProvider>
  );
}

export default function OnboardingPage() {
  const [hasSession, setHasSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/';
        return;
      }
      setHasSession(true);
    });
  }, []);

  if (!hasSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <AuthProvider>
      <OnboardingInner />
    </AuthProvider>
  );
}
