'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usersApi, teamsApi } from '@/lib/api';
import type { User, TeamOut } from '@/lib/api.types';
import UserFormWizard from '@/app/users/components/UserFormWizard';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<TeamOut[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([usersApi.list(), teamsApi.list()])
      .then(([allUsers, allTeams]) => {
        const found = allUsers.find((u) => u.id === id) ?? null;
        setUser(found);
        setUsers(allUsers);
        setTeams(allTeams);
        if (!found) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <p className="text-lg font-semibold">User not found</p>
        <a href="/users" className="text-sm text-cyan-600 hover:underline">Back to Users</a>
      </div>
    );
  }

  return <UserFormWizard mode="edit" initialUser={user!} teams={teams} users={users} />;
}
