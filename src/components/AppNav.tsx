import Link from 'next/link';
import UserNav from './UseNav';

/** Top bar for pages outside a project (home, create, edit). */
export default function AppNav() {
  return (
    <nav className="flex items-center justify-between border-b border-nyx-border px-6 py-4">
      <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet">
        <p className="text-lg font-semibold tracking-tight">Group Project Manager</p>
        <p className="text-sm text-slate-400">Keep your team aligned and moving forward.</p>
      </Link>
      <UserNav />
    </nav>
  );
}
