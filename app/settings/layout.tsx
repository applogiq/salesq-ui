'use client';

/**
 * Settings is off-limits for the executive role.
 * AppShell is provided by the root ConditionalShell — no need to wrap here.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/AuthContext';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role === 'executive') router.replace('/dashboard');
  }, [role, router]);

  if (role === 'executive') return null;
  return <>{children}</>;
}
