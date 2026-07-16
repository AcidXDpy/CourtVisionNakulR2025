import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import AboutGearVision from './components/AboutGearVision.jsx';
import BetaResearch from './components/BetaResearch.jsx';
import CourtVisionImpact from './components/CourtVisionImpact.jsx';
import GearStory from './components/GearStory.jsx';
import GearGuidesPage from './components/GearGuidesPage.jsx';
import Hero from './components/Hero.jsx';
import Navbar from './components/Navbar.jsx';
import PlaystyleQuiz from './components/PlaystyleQuiz.jsx';
import PlayItForwardPage from './components/PlayItForwardPage.jsx';
import RacketFinder from './components/RacketFinder.jsx';
import RecycleBallsPage from './components/RecycleBallsPage.jsx';
import ResultsDashboard from './components/ResultsDashboard.jsx';
import StringFinder from './components/StringFinder.jsx';
import { playstyleNames } from './data/playstyles.js';
import { trackEvent } from './lib/analytics.js';
import { completeAuthRedirect, getSession, onAuthStateChange, saveQuizSubmission } from './lib/supabaseClient.js';

const ImpactDashboardPage = lazy(() => import('./components/ImpactDashboardPage.jsx'));
const LoginPage = lazy(() => import('./components/LoginPage.jsx'));
const MethodologyPage = lazy(() => import('./components/MethodologyPage.jsx'));
const ProfilePage = lazy(() => import('./components/ProfilePage.jsx'));

const routes = new Set(['home', 'quiz', 'gear', 'strings', 'guides', 'methodology', 'impact', 'login', 'profile', 'play-it-forward', 'recycle', 'results']);
const pathRoutes = new Map([
  ['/guides', 'guides'],
  ['/methodology', 'methodology'],
  ['/impact', 'impact'],
  ['/login', 'login'],
  ['/profile', 'profile'],
  ['/play-it-forward', 'play-it-forward'],
  ['/recycle', 'recycle'],
]);

function readRoute() {
  const hash = window.location.hash.replace('#', '');
  if (routes.has(hash)) return hash;

  const pathRoute = pathRoutes.get(window.location.pathname);
  if (pathRoute) return pathRoute;

  if (hash) {
    window.history.replaceState(null, '', `${window.location.origin}/#home`);
  }

  return 'home';
}

export default function App() {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [manualStyle, setManualStyle] = useState(playstyleNames[0]);
  const [route, setRoute] = useState(readRoute);
  const [session, setSession] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading');
  const [authMessage, setAuthMessage] = useState('');

  const activeStyle = useMemo(() => result?.primary || manualStyle, [manualStyle, result]);
  const activePage = route === 'results' ? 'quiz' : route;

  useEffect(() => {
    function syncRoute() {
      const nextRoute = readRoute();
      setRoute(nextRoute);
      window.setTimeout(() => {
        if (nextRoute === 'results') {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }

    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let initializing = true;
    const unsubscribe = onAuthStateChange((nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (initializing) return;
      setAuthStatus('ready');
      setAuthMessage('');
    });

    async function initializeAuth() {
      setAuthStatus('loading');
      const redirectResult = await completeAuthRedirect();
      if (!mounted) return;

      if (redirectResult?.ok === false && !redirectResult?.skipped) {
        initializing = false;
        setAuthStatus('error');
        setAuthMessage(redirectResult.message || 'Could not finish sign-in.');
        setSession(null);
        return;
      }

      const nextSession = redirectResult?.session || (await getSession());
      if (!mounted) return;
      initializing = false;
      setSession(nextSession);
      setAuthStatus('ready');
      setAuthMessage('');
    }

    initializeAuth();

    return () => {
      mounted = false;
      initializing = false;
      unsubscribe();
    };
  }, []);

  function startQuiz() {
    trackEvent('quiz_started', { source: 'app_start_quiz' });
    window.location.hash = 'quiz';
  }

  function completeQuiz(nextResult) {
    setResult(nextResult);
    setManualStyle(nextResult.primary);
    trackEvent('quiz_completed', {
      primary: nextResult.primary,
      budgetTier: nextResult.budgetTier,
      consentToResearch: Boolean(nextResult.consentToResearch),
    });
    saveQuizSubmission(nextResult);
    window.location.hash = 'results';
  }

  function resetQuiz() {
    setAnswers({});
    setResult(null);
  }

  function setGlobalStyle(style) {
    setManualStyle(style);
  }

  return (
    <div className="min-h-screen text-court-ink">
      <Navbar activePage={activePage} user={session?.user} authStatus={authStatus} />
      <main>
        {activePage === 'home' && (
          <>
            <Hero onStartQuiz={startQuiz} />
            <BetaResearch onStartQuiz={startQuiz} />
            <CourtVisionImpact />
            <GearStory />
            <AboutGearVision />
          </>
        )}
        {activePage === 'quiz' && (
          <>
            <PlaystyleQuiz answers={answers} setAnswers={setAnswers} onComplete={completeQuiz} onReset={resetQuiz} />
            <ResultsDashboard result={result} />
          </>
        )}
        {activePage === 'gear' && <RacketFinder selectedStyle={activeStyle} setSelectedStyle={setGlobalStyle} result={result} />}
        {activePage === 'strings' && <StringFinder selectedStyle={activeStyle} setSelectedStyle={setGlobalStyle} result={result} />}
        {activePage === 'guides' && <GearGuidesPage />}
        <Suspense fallback={<div className="section-pad text-center text-sm font-bold text-slate-600">Loading GearVision...</div>}>
          {activePage === 'methodology' && <MethodologyPage />}
          {activePage === 'impact' && <ImpactDashboardPage />}
          {activePage === 'login' && <LoginPage session={session} authStatus={authStatus} authMessage={authMessage} />}
          {activePage === 'profile' && <ProfilePage session={session} authStatus={authStatus} authMessage={authMessage} />}
        </Suspense>
        {activePage === 'play-it-forward' && <PlayItForwardPage />}
        {activePage === 'recycle' && <RecycleBallsPage />}
      </main>
      <footer className="border-t border-court-line bg-white px-4 py-8 text-center text-sm text-slate-500">
        GearVision is an educational beta for tennis gear recommendations, player feedback, and gear access research.
      </footer>
    </div>
  );
}
