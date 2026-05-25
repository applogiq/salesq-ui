import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CallProvider } from '@/context/CallContext';
import ConditionalShell from '@/components/ConditionalShell';

export const metadata: Metadata = {
  title: 'SalesQ – AI Sales Platform',
  description: 'AI Sales Calling · CRM · Coaching',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CallProvider>
            <ConditionalShell>{children}</ConditionalShell>
          </CallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
