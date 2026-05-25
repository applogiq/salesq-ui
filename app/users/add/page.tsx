'use client';

import { useState, useEffect } from 'react';
import { usersApi, teamsApi } from '@/lib/api';
import type { User, TeamOut } from '@/lib/api.types';
import UserFormWizard from '@/app/users/components/UserFormWizard';

export default function AddUserPage() {
  const [teams, setTeams] = useState<TeamOut[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([teamsApi.list(), usersApi.list()])
      .then(([t, u]) => { setTeams(t); setUsers(u); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <UserFormWizard mode="create" teams={teams} users={users} />;
}
