'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';
import type { AuthUser } from '../lib/types';
import { cn } from './ui';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/customers', label: 'Customers' },
  { href: '/plans', label: 'Plans' },
  { href: '/subscriptions', label: 'Subscriptions' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/webhooks', label: 'Webhooks' },
  { href: '/audit', label: 'Audit log' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get<AuthUser>('/auth/me') });
  const logout = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => router.replace('/login'),
  });

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-6 px-2">
        <div className="text-sm font-semibold">SBS Admin</div>
        <div className="text-xs text-zinc-500">Subscription Billing</div>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm',
                active
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-zinc-800 pt-4">
        <div className="truncate px-3 text-xs text-zinc-500">{me?.email ?? '—'}</div>
        <button
          onClick={() => logout.mutate()}
          className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
