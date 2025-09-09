import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import db, { initializeDatabase } from './database.js';
import authRoutes, { authenticateToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase().catch(console.error);

// Ensure extra tables exist (gamification, missions, badges)
(function initializeExtraTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS gamification (
        user_id INTEGER PRIMARY KEY,
        gems INTEGER DEFAULT 4000,
        daily_streak INTEGER DEFAULT 0,
        last_correct_date TEXT,
        freeze_count INTEGER DEFAULT 0,
        last_week_claimed TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating gamification table:', err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS daily_missions (
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        mission_key TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        reward_claimed INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, date, mission_key),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating daily_missions table:', err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS badges (
        user_id INTEGER NOT NULL,
        badge_key TEXT NOT NULL,
        title TEXT NOT NULL,
        month TEXT NOT NULL,
        awarded_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, badge_key),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating badges table:', err);
    });
  });
})();

// Auth routes
app.use('/api/auth', authRoutes);

let wordCollection = [];

async function loadWordsFromFile() {
  try {
    const filePath = path.join(__dirname, 'words.txt');
    const data = await fs.readFile(filePath, 'utf8');
    wordCollection = data.split('\n').map(word => word.trim()).filter(Boolean);
    if (wordCollection.length === 0) {
      console.warn('words.txt is empty. Using fallback word.');
      wordCollection = ['fallback'];
    }
  } catch (error) {
    console.error('Error loading words.txt:', error.message);
    wordCollection = ['error'];
  }
}

// Load words when server starts
loadWordsFromFile();

// Endpoint to get all words
app.get('/api/words', (req, res) => {
  res.json(wordCollection);
});

// Endpoint to add a new word
app.post('/api/words', (req, res) => {
  const { word } = req.body;
  if (!word) {
    return res.status(400).json({ error: 'Word is required' });
  }
  if (wordCollection.includes(word.toLowerCase())) {
    return res.status(400).json({ error: 'Word already exists' });
  }
  wordCollection.push(word.toLowerCase());
  res.status(201).json({ message: 'Word added successfully', word: word.toLowerCase() });
});

// Endpoint to remove a word
app.delete('/api/words/:word', (req, res) => {
  const wordToRemove = req.params.word.toLowerCase();
  const index = wordCollection.indexOf(wordToRemove);
  if (index === -1) {
    return res.status(404).json({ error: 'Word not found' });
  }
  wordCollection.splice(index, 1);
  res.json({ message: 'Word removed successfully' });
});

// Function to fetch word details from dictionary API
async function fetchWordDetails(word) {
  try {
    console.log(`Fetching details for word: ${word}`);
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = response.data[0];
    const pronunciation = data.phonetics?.find(p => p.text)?.text || `/${word}/`;
    const definition = data.meanings?.[0]?.definitions?.[0]?.definition || 'No definition found.';
    const example = data.meanings?.[0]?.definitions?.[0]?.example || 'No example available.';
    return { word: data.word, pronunciation, definition, example };
  } catch (error) {
    console.error(`Failed to fetch details for "${word}"`);
    return {
      word,
      pronunciation: `/${word}/`,
      definition: 'Could not retrieve definition for this word.',
      example: 'An error occurred while fetching details.'
    };
  }
}

// Endpoint to get a random word with details
app.get('/api/word-of-the-day', async (req, res) => {
  if (wordCollection.length === 0) {
    return res.status(404).json({ error: 'No words available' });
  }
  const randomIndex = Math.floor(Math.random() * wordCollection.length);
  const randomWord = wordCollection[randomIndex];
  const wordDetails = await fetchWordDetails(randomWord);
  res.json(wordDetails);
});

// ==================== Aptitude + Gamification ====================
function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(dateStrA, dateStrB) {
  if (!dateStrA || !dateStrB) return 0;
  const [aY, aM, aD] = dateStrA.split('-').map(Number);
  const [bY, bM, bD] = dateStrB.split('-').map(Number);
  const a = new Date(aY, aM - 1, aD);
  const b = new Date(bY, bM - 1, bD);
  const diffMs = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getWeekKeyFromYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
  const weekStr = String(weekNo).padStart(2, '0');
  return `${tempDate.getUTCFullYear()}-${weekStr}`;
}

function getMonthKeyFromYMD(ymd) {
  const [y, m] = ymd.split('-');
  return `${y}-${m}`;
}

function ensureGamificationRow(userId) {
  return new Promise((resolve, reject) => {
    db.run('INSERT OR IGNORE INTO gamification (user_id) VALUES (?)', [userId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function getGamificationState(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT user_id, gems, daily_streak, last_correct_date, freeze_count, last_week_claimed FROM gamification WHERE user_id = ?', [userId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function setGamificationState(userId, updates) {
  const fields = [];
  const values = [];
  for (const [k, v] of Object.entries(updates)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  values.push(userId);
  const sql = `UPDATE gamification SET ${fields.join(', ')} WHERE user_id = ?`;
  return new Promise((resolve, reject) => {
    db.run(sql, values, (err) => (err ? reject(err) : resolve()));
  });
}

async function awardWeeklyGemsIfEligible(userId, todayYMD) {
  const state = await getGamificationState(userId);
  const currentWeek = getWeekKeyFromYMD(todayYMD);
  if (state.last_week_claimed !== currentWeek) {
    await setGamificationState(userId, {
      gems: state.gems + 100,
      last_week_claimed: currentWeek
    });
    return true;
  }
  return false;
}

function upsertDailyMission(userId, dateYMD, missionKey, completed, rewardClaimed) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO daily_missions (user_id, date, mission_key, completed, reward_claimed)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date, mission_key)
       DO UPDATE SET completed = max(completed, excluded.completed), reward_claimed = max(reward_claimed, excluded.reward_claimed)`,
      [userId, dateYMD, missionKey, completed ? 1 : 0, rewardClaimed ? 1 : 0],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

function getMission(userId, dateYMD, missionKey) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT user_id, date, mission_key, completed, reward_claimed FROM daily_missions WHERE user_id = ? AND date = ? AND mission_key = ?',
      [userId, dateYMD, missionKey],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });
}

function countMissionsCompletedInMonth(userId, monthKey) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) AS cnt FROM daily_missions WHERE user_id = ? AND substr(date, 1, 7) = ? AND completed = 1`,
      [userId, monthKey],
      (err, row) => (err ? reject(err) : resolve(row.cnt))
    );
  });
}

function hasBadge(userId, badgeKey) {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1 FROM badges WHERE user_id = ? AND badge_key = ?', [userId, badgeKey], (err, row) => (err ? reject(err) : resolve(!!row)));
  });
}

function awardBadge(userId, badgeKey, title, month) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR IGNORE INTO badges (user_id, badge_key, title, month) VALUES (?, ?, ?, ?)',
      [userId, badgeKey, title, month],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

function listBadges(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT badge_key, title, month, awarded_at FROM badges WHERE user_id = ? ORDER BY awarded_at DESC', [userId], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// Problem generator (fresh every call)
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePercentageProblem() {
  const base = randomInt(100, 1000);
  const x = [5, 10, 12, 15, 20, 25, 30][randomInt(0, 6)];
  const correct = (base * x) / 100;
  const options = shuffle([
    correct,
    correct + randomInt(5, 20),
    Math.max(1, correct - randomInt(5, 20)),
    Math.round(correct * 1.1)
  ]).map(v => `${v}`);
  const answerValue = `${correct}`;
  const answerIndex = options.indexOf(answerValue);
  return {
    id: `pct-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    question: `What is ${x}% of ${base}?`,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `x% of N = (x/100)×N. Here, ${x}% of ${base} = (${x}/100)×${base} = ${correct}.`
  };
}

function generateSpeedDistanceProblem() {
  const speed = randomInt(20, 80);
  const time = randomInt(1, 5);
  const distance = speed * time;
  const options = shuffle([
    `${distance}`,
    `${distance + randomInt(5, 40)}`,
    `${Math.max(5, distance - randomInt(5, 40))}`,
    `${Math.round(distance * 1.1)}`
  ]);
  const answerIndex = options.indexOf(`${distance}`);
  return {
    id: `spd-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'aptitude',
    question: `A vehicle travels at ${speed} km/h for ${time} hours. What distance does it cover (in km)?`,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Distance = Speed × Time = ${speed} × ${time} = ${distance} km.`
  };
}

function generateAverageProblem() {
  const a = randomInt(10, 40), b = randomInt(10, 40), c = randomInt(10, 40);
  const avg = (a + b + c) / 3;
  const options = shuffle([
    avg.toFixed(2),
    (avg + randomInt(1, 5)).toFixed(2),
    Math.max(1, avg - randomInt(1, 5)).toFixed(2),
    (avg * 1.1).toFixed(2)
  ]);
  const answerIndex = options.indexOf(avg.toFixed(2));
  return {
    id: `avg-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    question: `Find the average of ${a}, ${b}, and ${c}.`,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Average = (sum of values) / (number of values) = (${a}+${b}+${c})/3 = ${avg.toFixed(2)}.`
  };
}

function generateProblem() {
  const generators = [generatePercentageProblem, generateSpeedDistanceProblem, generateAverageProblem];
  const gen = generators[randomInt(0, generators.length - 1)];
  return gen();
}

// Get current gamification state
app.get('/api/gamification/state', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    await ensureGamificationRow(userId);
    const state = await getGamificationState(userId);
    res.json(state);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get gamification state' });
  }
});

// Buy a streak freeze with gems (default cost: 200 gems)
app.post('/api/store/buy-freeze', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const qty = Math.max(1, parseInt(req.body?.quantity ?? 1, 10));
    const costPer = 200;
    const totalCost = qty * costPer;
    await ensureGamificationRow(userId);
    const state = await getGamificationState(userId);
    if (state.gems < totalCost) {
      return res.status(400).json({ error: 'Not enough gems' });
    }
    await setGamificationState(userId, {
      gems: state.gems - totalCost,
      freeze_count: state.freeze_count + qty
    });
    const updated = await getGamificationState(userId);
    res.json({ message: 'Freeze purchased', state: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to purchase freeze' });
  }
});

// Get a fresh aptitude problem
app.get('/api/aptitude/problem', authenticateToken, async (req, res) => {
  try {
    const problem = generateProblem();
    res.json(problem);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate problem' });
  }
});

// Submit an answer and update streak, missions, rewards
app.post('/api/aptitude/answer', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { correct, category, clientDate } = req.body || {};
    const todayYMD = typeof clientDate === 'string' && clientDate.match(/^\d{4}-\d{2}-\d{2}$/)
      ? clientDate
      : formatDateYMD(new Date());

    await ensureGamificationRow(userId);
    let state = await getGamificationState(userId);

    let weeklyRewardGranted = false;
    let missionRewardGranted = false;
    let badgeAwarded = null;

    if (correct) {
      // Streak update
      const last = state.last_correct_date;
      if (!last) {
        state.daily_streak = 1;
      } else {
        const delta = daysBetween(last, todayYMD);
        if (delta === 0) {
          // already credited today
        } else if (delta === 1) {
          state.daily_streak = state.daily_streak + 1;
        } else if (delta === 2 && state.freeze_count > 0) {
          // consume a freeze to bridge a missed day
          state.freeze_count = state.freeze_count - 1;
          state.daily_streak = state.daily_streak + 1;
        } else {
          state.daily_streak = 1;
        }
      }

      // Set last_correct_date to today
      state.last_correct_date = todayYMD;

      // Weekly reward (+100 gems once per week on any correct day)
      weeklyRewardGranted = await awardWeeklyGemsIfEligible(userId, todayYMD);
      if (weeklyRewardGranted) {
        state = await getGamificationState(userId);
      }

      // Daily mission: solve_math_problem (only for category 'math')
      if (category === 'math') {
        await upsertDailyMission(userId, todayYMD, 'solve_math_problem', true, false);
        const mission = await getMission(userId, todayYMD, 'solve_math_problem');
        if (mission && mission.completed === 1 && mission.reward_claimed === 0) {
          // grant 20 gems and mark reward_claimed
          await setGamificationState(userId, { gems: state.gems + 20 });
          await upsertDailyMission(userId, todayYMD, 'solve_math_problem', true, true);
          missionRewardGranted = true;
          state = await getGamificationState(userId);
        }
      }

      // Badges: monthly badge if 30 missions completed in month
      const monthKey = getMonthKeyFromYMD(todayYMD);
      const completedThisMonth = await countMissionsCompletedInMonth(userId, monthKey);
      if (completedThisMonth >= 30) {
        const badgeKey = `monthly-${monthKey}`;
        const already = await hasBadge(userId, badgeKey);
        if (!already) {
          const [y, m] = monthKey.split('-').map(Number);
          const date = new Date(y, m - 1, 1);
          const monthName = date.toLocaleString('en-US', { month: 'long' });
          const title = `${monthName} ${y}`;
          await awardBadge(userId, badgeKey, title, monthKey);
          // bonus reward for badge
          await setGamificationState(userId, { gems: state.gems + 300 });
          badgeAwarded = { badge_key: badgeKey, title, month: monthKey };
          state = await getGamificationState(userId);
        }
      }

      // Persist updated streak and dates
      await setGamificationState(userId, {
        daily_streak: state.daily_streak,
        last_correct_date: state.last_correct_date,
        freeze_count: state.freeze_count,
        gems: state.gems
      });
    }

    const updated = await getGamificationState(userId);
    res.json({
      message: 'Answer processed',
      correct: !!correct,
      state: updated,
      weeklyRewardGranted,
      missionRewardGranted,
      badgeAwarded
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to process answer' });
  }
});

// Missions and badges listing
app.get('/api/missions/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const todayYMD = formatDateYMD(new Date());
    await ensureGamificationRow(userId);
    const mission = await getMission(userId, todayYMD, 'solve_math_problem');
    const monthKey = getMonthKeyFromYMD(todayYMD);
    const monthCount = await countMissionsCompletedInMonth(userId, monthKey);
    res.json({
      date: todayYMD,
      missions: [
        {
          mission_key: 'solve_math_problem',
          title: 'Complete one math problem',
          completed: mission ? mission.completed === 1 : false,
          reward_claimed: mission ? mission.reward_claimed === 1 : false,
          reward: 20
        }
      ],
      month: monthKey,
      monthCompletedCount: monthCount
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get today missions' });
  }
});

app.get('/api/badges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const badges = await listBadges(userId);
    res.json(badges);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get badges' });
  }
});

// Serve static files from React app build (if exists)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
