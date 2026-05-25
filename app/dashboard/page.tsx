'use client';
import { useRole } from '@/context/RoleContext';
import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard';
import TeamDashboard from '@/components/dashboard/TeamDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const { role } = useRole();

  if (role === 'team-lead') return <TeamDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  return <ExecutiveDashboard />;
}
