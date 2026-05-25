'use client';

/**
 * Wraps all routes with AppShell EXCEPT public routes (login, etc.).
 * Lives in the root layout so AppShell — Sidebar, TopBar — is mounted
 * exactly once and never re-mounts on client-side navigation.
 */

import { usePathname } from 'next/navigation';
import AppShell from './AppShell';

const PUBLIC_PREFIXES = ['/login'];

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );

  if (isPublic) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
