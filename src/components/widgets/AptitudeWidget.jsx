import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = 'http://localhost:3001';

function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const AptitudeWidget = () => {
  const { token } = useAuth();
  const todayStr = useMemo(() => formatDateYMD(new Date()), []);

  // Problem UI
  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [result, setResult] = useState(null); // 'correct' | 'incorrect' | null

  // Gamification state
  const [streak, setStreak] = useState(0);
  const [gems, setGems] = useState(0);
  const [freezeCount, setFreezeCount] = useState(0);
  const [weeklyRewardGranted, setWeeklyRewardGranted] = useState(false);
  const [missionRewardGranted, setMissionRewardGranted] = useState(false);
  const [badgeAwarded, setBadgeAwarded] = useState(null);

  // Missions
  const [todayMission, setTodayMission] = useState(null);
  const [monthInfo, setMonthInfo] = useState({ key: '', completed: 0 });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  const loadGamification = async () => {
    const data = await apiFetch('/api/gamification/state');
    setStreak(data.daily_streak || 0);
    setGems(data.gems || 0);
    setFreezeCount(data.freeze_count || 0);
  };

  const loadMissions = async () => {
    const data = await apiFetch('/api/missions/today');
    const mission = data.missions?.find(m => m.mission_key === 'solve_math_problem');
    setTodayMission(mission || null);
    setMonthInfo({ key: data.month, completed: data.monthCompletedCount || 0 });
  };

  const loadProblem = async () => {
    setLoadingProblem(true);
    setSelectedIndex(null);
    setShowSolution(false);
    setResult(null);
    setWeeklyRewardGranted(false);
    setMissionRewardGranted(false);
    setBadgeAwarded(null);
    try {
      const data = await apiFetch('/api/aptitude/problem');
      setProblem(data);
    } catch (e) {
      console.error('Failed to load problem', e);
      setProblem(null);
    } finally {
      setLoadingProblem(false);
    }
  };

  const handleCheckSolution = async () => {
    if (selectedIndex == null || !problem) return;
    const isCorrect = selectedIndex === problem.answerIndex;
    setResult(isCorrect ? 'correct' : 'incorrect');
    setShowSolution(true);

    try {
      const resp = await apiFetch('/api/aptitude/answer', {
        method: 'POST',
        body: JSON.stringify({
          correct: isCorrect,
          category: problem.category,
          clientDate: todayStr
        })
      });
      const st = resp.state;
      setStreak(st.daily_streak || 0);
      setGems(st.gems || 0);
      setFreezeCount(st.freeze_count || 0);
      setWeeklyRewardGranted(!!resp.weeklyRewardGranted);
      setMissionRewardGranted(!!resp.missionRewardGranted);
      setBadgeAwarded(resp.badgeAwarded || null);
      await loadMissions();
    } catch (e) {
      console.error('Failed to submit answer', e);
    }
  };

  const handleBuyFreeze = async () => {
    try {
      const resp = await apiFetch('/api/store/buy-freeze', {
        method: 'POST',
        body: JSON.stringify({ quantity: 1 })
      });
      const st = resp.state;
      setStreak(st.daily_streak || 0);
      setGems(st.gems || 0);
      setFreezeCount(st.freeze_count || 0);
    } catch (e) {
      console.error('Failed to buy freeze', e);
    }
  };

  useEffect(() => {
    // initial load
    (async () => {
      try {
        await loadGamification();
        await loadMissions();
      } catch (e) {
        console.error('Init load failed', e);
      } finally {
        await loadProblem();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const headerActions = (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-sm"
        title="Daily streak increases when you answer correctly on a new day."
      >
        <span>🔥</span>
        <span>{streak}</span>
      </div>
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm"
        title="Gems"
      >
        <span>💎</span>
        <span>{gems}</span>
      </div>
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-sm"
        title="Streak Freezes in inventory"
      >
        <span>❄️</span>
        <span>{freezeCount}</span>
      </div>
      <button
        onClick={handleBuyFreeze}
        className="text-xs bg-primary dark:text-dark-text light:text-light-text px-2 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300"
        title="Buy one streak freeze for 200 gems"
      >
        Buy Freeze (-200)
      </button>
      <button
        onClick={loadProblem}
        className="text-sm bg-primary dark:text-dark-text light:text-light-text px-2 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300"
      >
        New Problem
      </button>
    </div>
  );

  return (
    <section
      id="aptitude-widget"
      data-widget="aptitude-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[420px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent flex justify-between items-center">
        <h2 className="text-xl font-semibold">Aptitude Practice</h2>
        {headerActions}
      </div>

      {/* Missions summary */}
      <div className="px-4 pt-3">
        {todayMission && (
          <div className="flex items-center justify-between p-3 rounded-xl border dark:border-dark-accent light:border-light-accent">
            <div className="text-sm">
              <div className="font-medium">Daily Mission: {todayMission.title}</div>
              <div className="text-xs opacity-80">Reward: {todayMission.reward} 💎 • Month {monthInfo.key} completed: {monthInfo.completed}</div>
            </div>
            <div className="text-sm">
              {todayMission.completed ? (
                <span className="text-green-600">Completed</span>
              ) : (
                <span className="text-yellow-600">Pending</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {weeklyRewardGranted && (
          <div className="mb-3 p-2 rounded bg-emerald-500/15 text-emerald-600 text-sm">+100 💎 Weekly reward</div>
        )}
        {missionRewardGranted && (
          <div className="mb-3 p-2 rounded bg-emerald-500/15 text-emerald-600 text-sm">Daily mission reward claimed</div>
        )}
        {badgeAwarded && (
          <div className="mb-3 p-2 rounded bg-purple-500/15 text-purple-600 text-sm">New badge: {badgeAwarded.title}</div>
        )}

        {!problem || loadingProblem ? (
          <div className="text-lg">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="text-base leading-relaxed">
              {problem.question}
            </div>

            <div className="space-y-2">
              {problem.options.map((opt, idx) => {
                const isSelected = idx === selectedIndex;
                const isCorrect = showSolution && idx === problem.answerIndex;
                const isWrongSelection = showSolution && isSelected && idx !== problem.answerIndex;
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none 
                      ${isCorrect ? 'border-green-500 bg-green-500/10' : ''}
                      ${isWrongSelection ? 'border-red-500 bg-red-500/10' : ''}
                      ${!showSolution && isSelected ? 'border-blue-500 bg-blue-500/10' : 'dark:border-dark-accent light:border-light-accent'}
                    `}
                  >
                    <input
                      type="radio"
                      name="aptitude-option"
                      className="accent-blue-600"
                      disabled={showSolution}
                      checked={isSelected}
                      onChange={() => setSelectedIndex(idx)}
                    />
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <span className="text-green-600">✓</span>}
                    {isWrongSelection && <span className="text-red-600">✕</span>}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              {!showSolution ? (
                <button
                  onClick={handleCheckSolution}
                  disabled={selectedIndex == null}
                  className="bg-primary dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  Check Solution
                </button>
              ) : (
                <button
                  onClick={loadProblem}
                  className="bg-primary dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Next Problem
                </button>
              )}

              {showSolution && result && (
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    result === 'correct' ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600'
                  }`}
                >
                  {result === 'correct' ? 'Correct!' : 'Incorrect'}
                </div>
              )}
            </div>

            {showSolution && (
              <div className="mt-2 p-4 rounded-xl bg-primary/10 dark:bg-primary/15 border-l-4 border-primary">
                <div className="font-semibold mb-1">Solution</div>
                <div className="text-sm leading-relaxed">{problem.explanation}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AptitudeWidget;
