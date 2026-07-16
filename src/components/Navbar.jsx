import { BarChart3, BookOpen, Cable, FlaskConical, HeartHandshake, Home, Recycle, Target, Trophy, UserRound } from 'lucide-react';

const baseLinks = [
  { label: 'Home', id: 'home', icon: Home },
  { label: 'Quiz', id: 'quiz', icon: Target },
  { label: 'Gear', id: 'gear', icon: Trophy },
  { label: 'Strings', id: 'strings', icon: Cable },
  { label: 'Guides', id: 'guides', icon: BookOpen, href: '/guides' },
  { label: 'Model', id: 'methodology', icon: FlaskConical, href: '/methodology' },
  { label: 'Impact', id: 'impact', icon: BarChart3, href: '/impact' },
  { label: 'Forward', id: 'play-it-forward', icon: HeartHandshake, href: '/play-it-forward' },
  { label: 'Recycle', id: 'recycle', icon: Recycle, href: '/recycle' },
];

export default function Navbar({ activePage, user }) {
  const links = [
    ...baseLinks,
    { label: user ? 'My Data' : 'Login', id: user ? 'profile' : 'login', icon: UserRound, href: user ? '/profile' : '/login' },
  ];

  const renderLink = ({ label, id, icon: Icon, href }, compact = false) => {
    const active = activePage === id;

    return (
      <a
        key={id}
        href={href || `/#${id}`}
        className={`focus-ring flex shrink-0 items-center gap-2 rounded-lg transition ${
          compact ? 'px-3 py-2 text-xs' : 'px-3 py-2 text-sm'
        } ${active ? 'bg-court-blue text-white shadow-card' : 'text-slate-600 hover:bg-court-blue/10 hover:text-court-ink'}`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={compact ? 14 : 16} />
        {label}
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-court-line bg-white/90 text-court-ink backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="/#home" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-court-blue/20 bg-court-blue shadow-sm">
            <img src="/images/brand/gear-vision-mark.png" alt="GearVision logo" className="h-full w-full object-cover" />
          </span>
          <span>
            <span className="block text-lg font-black tracking-wide">GearVision</span>
            <span className="hidden text-xs text-slate-500 sm:block">Tennis gear advisor</span>
          </span>
        </a>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => renderLink(link))}
        </div>
        <a href="/#quiz" className="focus-ring rounded-lg bg-court-green px-4 py-2 text-sm font-bold text-court-ink transition hover:bg-court-blue hover:text-white">
          Start Quiz
        </a>
      </nav>
      <div className="border-t border-court-line/70 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
          {links.map((link) => renderLink(link, true))}
        </div>
      </div>
    </header>
  );
}
