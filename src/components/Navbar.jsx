import { Cable, HeartHandshake, Home, Recycle, Target, Trophy } from 'lucide-react';

const links = [
  { label: 'Home', id: 'home', icon: Home },
  { label: 'Quiz', id: 'quiz', icon: Target },
  { label: 'Gear', id: 'gear', icon: Trophy },
  { label: 'Strings', id: 'strings', icon: Cable },
  { label: 'Forward', id: 'play-it-forward', icon: HeartHandshake, href: '/play-it-forward' },
  { label: 'Recycle', id: 'recycle', icon: Recycle, href: '/recycle' },
];

export default function Navbar({ activePage }) {
  return (
    <header className="sticky top-0 z-40 border-b border-court-line bg-white/90 text-court-ink backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-court-blue to-slate-200 text-court-ink font-black">CV</span>
          <span>
            <span className="block text-lg font-black tracking-wide">CourtVision</span>
            <span className="hidden text-xs text-slate-500 sm:block">Tennis gear advisor</span>
          </span>
        </a>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(({ label, id, icon: Icon, href }) => {
            const active = activePage === id;

            return (
              <a
                key={id}
                href={href || `#${id}`}
                className={`focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  active ? 'bg-court-blue text-white shadow-card' : 'text-slate-600 hover:bg-court-blue/10 hover:text-court-ink'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={16} />
                {label}
              </a>
            );
          })}
        </div>
        <a href="#quiz" className="focus-ring rounded-lg bg-court-green px-4 py-2 text-sm font-bold text-court-ink transition hover:bg-court-blue hover:text-white">
          Start Quiz
        </a>
      </nav>
    </header>
  );
}
