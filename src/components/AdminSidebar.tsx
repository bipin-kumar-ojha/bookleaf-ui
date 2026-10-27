'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Users } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const items = [
    { href: '/admin', label: 'All tickets', icon: Ticket },
    { href: '/admin/users', label: 'All users', icon: Users },
  ];

  return (
    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] lg:sticky lg:top-28">
      <p className="px-3 pb-3 pt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
      <nav aria-label="Admin navigation" className="flex gap-2 lg:flex-col">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`flex min-h-11 flex-1 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors lg:flex-none ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
