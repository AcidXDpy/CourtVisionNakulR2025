import { useEffect, useMemo, useState } from 'react';
import CourtVisionImpact from './components/CourtVisionImpact.jsx';
import GearStory from './components/GearStory.jsx';
import Hero from './components/Hero.jsx';
import Navbar from './components/Navbar.jsx';
import PlaystyleQuiz from './components/PlaystyleQuiz.jsx';
import PlayItForwardPage from './components/PlayItForwardPage.jsx';
import RacketFinder from './components/RacketFinder.jsx';
import RecycleBallsPage from './components/RecycleBallsPage.jsx';
import ResultsDashboard from './components/ResultsDashboard.jsx';
import StringFinder from './components/StringFinder.jsx';
import { playstyleNames } from './data/playstyles.js';
import { saveQuizSubmission } from './lib/supabaseClient.js';

const routes = new Set(['home', 'quiz', 'gear', 'strings', 'play-it-forward', 'recycle', 'results']);
const pathRoutes = new Map([
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

  function startQuiz() {
    window.location.hash = 'quiz';
  }

  function completeQuiz(nextResult) {
    setResult(nextResult);
    setManualStyle(nextResult.primary);
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
      <Navbar activePage={activePage} />
      <main>
        {activePage === 'home' && (
          <>
            <Hero onStartQuiz={startQuiz} />
            <CourtVisionImpact />
            <GearStory />
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
        {activePage === 'play-it-forward' && <PlayItForwardPage />}
        {activePage === 'recycle' && <RecycleBallsPage />}
      </main>
      <footer className="border-t border-court-line bg-white px-4 py-8 text-center text-sm text-slate-500">
        Gear Vision MVP - explainable gear recommendations, local feedback data, ready for Vercel.
      </footer>
    </div>
  );
}
