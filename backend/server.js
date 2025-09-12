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

// Additional problem generators for wider coverage
function generateProfitAndLossProblem() {
  const cp = randomInt(50, 500);
  const pct = [5, 10, 12, 15, 20, 25][randomInt(0, 5)];
  const isProfit = Math.random() < 0.5;
  const sp = isProfit ? Math.round(cp * (1 + pct / 100)) : Math.round(cp * (1 - pct / 100));
  const question = isProfit
    ? `An item costs ${cp} and is sold at a profit of ${pct}%. What is the selling price?`
    : `An item costs ${cp} and is sold at a loss of ${pct}%. What is the selling price?`;
  const options = shuffle([
    `${sp}`,
    `${sp + randomInt(2, 20)}`,
    `${Math.max(1, sp - randomInt(2, 20))}`,
    `${Math.round(sp * 1.1)}`
  ]);
  const answerIndex = options.indexOf(`${sp}`);
  return {
    id: `pl-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Selling Price = Cost Price × (1 ${isProfit ? '+' : '-'} ${pct}/100) = ${sp}.`
  };
}

function generateDirectionsProblem() {
  // Construct a net displacement (dx, dy) and back-fill moves to keep integers
  const dxBase = [3, 4, 5, 6][randomInt(0, 3)];
  const dyBase = [3, 4, 5, 6][randomInt(0, 3)];
  const xExtra = randomInt(0, 4);
  const yExtra = randomInt(0, 4);
  const north = dyBase + yExtra;
  const south = yExtra;
  const east = dxBase + xExtra;
  const west = xExtra;
  const distance = Math.sqrt(dxBase * dxBase + dyBase * dyBase);
  const question = `A person walks ${north} km north, ${east} km east, ${south} km south, and ${west} km west. How far is the person from the starting point (in km)?`;
  const correct = distance.toFixed(2);
  const options = shuffle([
    correct,
    (distance + randomInt(1, 3)).toFixed(2),
    Math.max(0, distance - randomInt(1, 3)).toFixed(2),
    (distance * 1.5).toFixed(2)
  ]);
  const answerIndex = options.indexOf(correct);
  return {
    id: `dir-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'reasoning',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Net displacement is √(dx² + dy²) where dx=${dxBase}, dy=${dyBase} ⇒ distance = ${correct} km.`
  };
}

function generateCaseStudyProblem() {
  // Simple data interpretation: highest sales
  const products = ['Alpha', 'Beta', 'Gamma', 'Delta'];
  const sales = products.map(() => randomInt(50, 200));
  const table = products.map((p, i) => `${p}: ${sales[i]}`).join(', ');
  const maxIdx = sales.indexOf(Math.max(...sales));
  const question = `A company reports the following monthly sales (in units): ${table}. Which product has the highest sales?`;
  const correct = products[maxIdx];
  const options = shuffle([
    correct,
    ...shuffle(products.filter((_, i) => i !== maxIdx)).slice(0, 3)
  ]);
  const answerIndex = options.indexOf(correct);
  return {
    id: `case-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'reasoning',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Compare the given values. The highest is ${correct} with ${sales[maxIdx]} units.`
  };
}

function generateSeatingArrangementProblem() {
  // Known arrangement left-to-right; ask immediate right
  const people = ['A', 'B', 'C', 'D', 'E'];
  const arrangement = shuffle(people);
  // pick a pivot not at the rightmost end
  const pivotIdx = randomInt(0, arrangement.length - 2);
  const pivot = arrangement[pivotIdx];
  const rightOfPivot = arrangement[pivotIdx + 1];
  const question = `Five friends ${people.join(', ')} sit in a row facing north in the order (left to right): ${arrangement.join(', ')}. Who sits to the immediate right of ${pivot}?`;
  const correct = rightOfPivot;
  const options = shuffle([
    correct,
    ...shuffle(people.filter(p => p !== correct)).slice(0, 3)
  ]);
  const answerIndex = options.indexOf(correct);
  return {
    id: `seat-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'reasoning',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `From the given order, ${rightOfPivot} is immediately to the right of ${pivot}.`
  };
}

function generateLogicalReasoningProblem() {
  // Simple arithmetic progression series
  const start = randomInt(1, 9);
  const diff = randomInt(2, 7);
  const seq = [start, start + diff, start + 2 * diff, start + 3 * diff, start + 4 * diff];
  const question = `Find the next number in the series: ${seq.slice(0, 4).join(', ')}, ?`;
  const correct = seq[4];
  const options = shuffle([
    `${correct}`,
    `${correct + diff}`,
    `${correct - diff}`,
    `${correct + randomInt(1, 3)}`
  ]);
  const answerIndex = options.indexOf(`${correct}`);
  return {
    id: `logic-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'reasoning',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `This is an arithmetic progression with common difference ${diff}. Next = last + ${diff} = ${correct}.`
  };
}

function generateAgeProblem() {
  // Sum and age difference -> A older than B
  let sum = randomInt(30, 80);
  const diff = randomInt(2, 12);
  // Ensure (sum + diff) is even for integer ages
  if ((sum + diff) % 2 !== 0) sum += 1;
  const ageA = (sum + diff) / 2;
  const ageB = sum - ageA;
  const question = `The sum of ages of A and B is ${sum}. A is ${diff} years older than B. What is A's age?`;
  const options = shuffle([
    `${ageA}`,
    `${ageA + randomInt(1, 3)}`,
    `${Math.max(1, ageA - randomInt(1, 3))}`,
    `${ageB}`
  ]);
  const answerIndex = options.indexOf(`${ageA}`);
  return {
    id: `age-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Let A = x, B = x - ${diff}. Then x + (x - ${diff}) = ${sum} ⇒ 2x = ${sum + diff} ⇒ x = ${ageA}.`
  };
}

function generateRelationshipsProblem() {
  const templates = [
    {
      q: (X, Y) => `${X} is the sister of ${Y}'s mother. How is ${X} related to ${Y}?`,
      a: 'Aunt'
    },
    {
      q: (X, Y) => `${X} is the son of ${Y}'s brother. How is ${X} related to ${Y}?`,
      a: 'Nephew'
    },
    {
      q: (X, Y) => `${X} is the daughter of ${Y}'s sister. How is ${X} related to ${Y}?`,
      a: 'Niece'
    }
  ];
  const names = ['Alex', 'Blair', 'Casey', 'Drew', 'Evan'];
  const X = names[randomInt(0, names.length - 1)];
  let Y = names[randomInt(0, names.length - 1)];
  if (Y === X) Y = names[(names.indexOf(Y) + 1) % names.length];
  const t = templates[randomInt(0, templates.length - 1)];
  const correct = t.a;
  const optionsPool = ['Aunt', 'Uncle', 'Mother', 'Father', 'Sister', 'Brother', 'Cousin', 'Nephew', 'Niece'];
  const options = shuffle([
    correct,
    ...shuffle(optionsPool.filter(o => o !== correct)).slice(0, 3)
  ]);
  const answerIndex = options.indexOf(correct);
  return {
    id: `rel-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'reasoning',
    question: t.q(X, Y),
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `By the definitions of family relations, ${correct} is the correct relation.`
  };
}

function generateBoatsAndStreamsProblem() {
  const u = randomInt(5, 20); // boat speed in still water
  const v = randomInt(1, Math.max(1, Math.min(6, u - 1))); // stream speed less than u
  const t = randomInt(1, 5);
  const distance = (u + v) * t;
  const question = `A boat's speed in still water is ${u} km/h and the stream speed is ${v} km/h. How far (in km) will it travel downstream in ${t} hours?`;
  const options = shuffle([
    `${distance}`,
    `${distance + randomInt(2, 10)}`,
    `${Math.max(1, distance - randomInt(2, 10))}`,
    `${Math.round(distance * 1.25)}`
  ]);
  const answerIndex = options.indexOf(`${distance}`);
  return {
    id: `boat-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Downstream speed = u + v = ${u + v} km/h, so distance = speed × time = ${u + v} × ${t} = ${distance} km.`
  };
}

function generateVerbalAnalogyProblem() {
  const pairs = [
    { a1: 'Cat', a2: 'Kitten', b1: 'Dog', b2: 'Puppy' },
    { a1: 'Bird', a2: 'Nest', b1: 'Bee', b2: 'Hive' },
    { a1: 'Car', a2: 'Road', b1: 'Boat', b2: 'Water' },
    { a1: 'Painter', a2: 'Brush', b1: 'Writer', b2: 'Pen' }
  ];
  const p = pairs[randomInt(0, pairs.length - 1)];
  const correct = p.b2;
  const distractors = shuffle(['Pup', 'Kennel', 'Sea', 'Ink', 'Paper', 'Nest', 'Calf', 'Foal', 'Hive', 'Water', 'Pen', 'Brush']).filter(x => x !== correct);
  const options = shuffle([
    correct,
    ...distractors.slice(0, 3)
  ]);
  const answerIndex = options.indexOf(correct);
  return {
    id: `verb-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'verbal',
    question: `${p.a1} : ${p.a2} :: ${p.b1} : ?`,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `${p.a1} is to ${p.a2} as ${p.b1} is to ${p.b2}.`
  };
}

// ---------------- Advanced-level generators ----------------
function generateCompoundInterestProblem() {
  const P = randomInt(1000, 10000);
  const R = randomInt(5, 15);
  const T = randomInt(2, 5);
  const A = Math.round(P * Math.pow(1 + R / 100, T));
  const question = `What will be the compound amount on ${P} at ${R}% per annum for ${T} years (compounded annually)?`;
  const options = shuffle([
    `${A}`,
    `${Math.round(A * 1.05)}`,
    `${Math.round(A * 0.95)}`,
    `${Math.round(P * (1 + (R / 100) * T))}` // simple interest amount as distractor
  ]);
  const answerIndex = options.indexOf(`${A}`);
  return {
    id: `ci-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `A = P(1 + R/100)^T = ${P}(1 + ${R}/100)^${T} = ${A}.`
  };
}

function generateSuccessiveDiscountsProblem() {
  const mrp = randomInt(200, 2000);
  const d1 = randomInt(10, 35);
  const d2 = randomInt(10, 35);
  const finalPrice = Math.round(mrp * (1 - d1 / 100) * (1 - d2 / 100));
  const eqDisc = 100 - (100 - d1) * (100 - d2) / 100;
  const eqDiscStr = eqDisc.toFixed(2);
  const question = `On an article with MRP ${mrp}, two successive discounts of ${d1}% and ${d2}% are offered. What is the equivalent single discount (in %)?`;
  const options = shuffle([
    `${eqDiscStr}`,
    `${(eqDisc + randomInt(2, 5)).toFixed(2)}`,
    `${Math.max(1, eqDisc - randomInt(2, 5)).toFixed(2)}`,
    `${(d1 + d2).toFixed(2)}` // common trap
  ]);
  const answerIndex = options.indexOf(`${eqDiscStr}`);
  return {
    id: `disc-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Equivalent discount = 100 − [(100 − d1)(100 − d2)]/100 = ${eqDiscStr}%.`
  };
}

function generateMixtureAlligationProblem() {
  const q1 = randomInt(3, 10);
  const q2 = randomInt(3, 10);
  let p1 = randomInt(10, 40);
  let p2 = randomInt(50, 90);
  if (p1 >= p2) { p1 = 30; p2 = 70; }
  const finalPct = ((p1 * q1 + p2 * q2) / (q1 + q2)).toFixed(2);
  const question = `Two solutions with ${p1}% and ${p2}% concentration are mixed in quantities ${q1} L and ${q2} L respectively. What is the concentration (%) of the resulting mixture?`;
  const options = shuffle([
    `${finalPct}`,
    `${(parseFloat(finalPct) + randomInt(2, 6)).toFixed(2)}`,
    `${Math.max(1, parseFloat(finalPct) - randomInt(2, 6)).toFixed(2)}`,
    `${((p1 + p2) / 2).toFixed(2)}`
  ]);
  const answerIndex = options.indexOf(`${finalPct}`);
  return {
    id: `mix-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Weighted average = (p1·q1 + p2·q2)/(q1+q2) = ${finalPct}%.`
  };
}

function generateTimeAndWorkProblem() {
  const a = randomInt(8, 20);
  const b = randomInt(12, 28);
  const t = (a * b) / (a + b);
  const tStr = t.toFixed(2);
  const question = `A can finish a work in ${a} days and B can finish it in ${b} days. Working together, in how many days will they finish the work?`;
  const options = shuffle([
    `${tStr}`,
    `${(t + randomInt(2, 5)).toFixed(2)}`,
    `${Math.max(1, t - randomInt(1, 3)).toFixed(2)}`,
    `${(a + b).toFixed(2)}`
  ]);
  const answerIndex = options.indexOf(`${tStr}`);
  return {
    id: `work-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Combined rate = 1/${a} + 1/${b} = ${(1/a + 1/b).toFixed(4)} ⇒ time = 1/rate = ${tStr} days.`
  };
}

function generatePipesAndCisternsProblem() {
  const a = randomInt(10, 40); // fill
  const b = randomInt(30, 90); // empty
  const netRate = 1 / a - 1 / b;
  const t = 1 / netRate;
  const tStr = t.toFixed(2);
  const question = `Pipe A can fill a tank in ${a} minutes, while leak B can empty it in ${b} minutes. If both are open, how long will it take to fill the tank?`;
  const options = shuffle([
    `${tStr}`,
    `${(t + randomInt(5, 10)).toFixed(2)}`,
    `${Math.max(1, t - randomInt(2, 5)).toFixed(2)}`,
    `${(a + b).toFixed(2)}`
  ]);
  const answerIndex = options.indexOf(`${tStr}`);
  return {
    id: `pipe-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Net rate = 1/${a} − 1/${b} = ${netRate.toFixed(4)} tank/min ⇒ time = 1/rate = ${tStr} min.`
  };
}

function nCr(n, r) {
  function fact(x) { let p = 1; for (let i = 2; i <= x; i++) p *= i; return p; }
  return Math.round(fact(n) / (fact(r) * fact(n - r)));
}

function generatePermutationCombinationProblem() {
  const n = randomInt(6, 10);
  const r = randomInt(2, Math.min(5, n - 1));
  const val = nCr(n, r);
  const question = `In how many ways can ${r} objects be chosen from ${n} distinct objects?`;
  const options = shuffle([
    `${val}`,
    `${val + randomInt(2, 15)}`,
    `${Math.max(1, val - randomInt(2, 15))}`,
    `${nCr(n, r - 1)}`
  ]);
  const answerIndex = options.indexOf(`${val}`);
  return {
    id: `ncr-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Number of combinations = nCr = ${n}!/(${r}!·${n - r}!) = ${val}.`
  };
}

function generateProbabilityProblem() {
  const R = randomInt(3, 6);
  const B = randomInt(3, 6);
  const total = R + B;
  const comb = (n, k) => nCr(n, k);
  const num = comb(R, 2);
  const den = comb(total, 2);
  const p = (num / den);
  const pStr = p.toFixed(4);
  const question = `A bag contains ${R} red and ${B} black balls. Two balls are drawn at random without replacement. What is the probability that both are red?`;
  const options = shuffle([
    `${pStr}`,
    `${(p + 0.05).toFixed(4)}`,
    `${Math.max(0, p - 0.05).toFixed(4)}`,
    `${(num / comb(total, 1)).toFixed(4)}`
  ]);
  const answerIndex = options.indexOf(`${pStr}`);
  return {
    id: `prob-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `P(2 red) = C(${R},2)/C(${total},2) = ${num}/${den} = ${pStr}.`
  };
}

function generateTrainsRelativeSpeedProblem() {
  const L1 = randomInt(120, 300); // m
  const L2 = randomInt(120, 300); // m
  const S1 = randomInt(40, 80);   // km/h
  const S2 = randomInt(30, 70);   // km/h
  const rel = (S1 + S2) * 1000 / 3600; // m/s
  const t = (L1 + L2) / rel;
  const tSec = Math.round(t);
  const question = `Two trains of lengths ${L1} m and ${L2} m are moving in opposite directions at ${S1} km/h and ${S2} km/h respectively. In how many seconds will they completely cross each other?`;
  const options = shuffle([
    `${tSec}`,
    `${tSec + randomInt(3, 12)}`,
    `${Math.max(1, tSec - randomInt(3, 12))}`,
    `${Math.round((L1 + L2) / (S1 * 1000 / 3600))}`
  ]);
  const answerIndex = options.indexOf(`${tSec}`);
  return {
    id: `train-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'math',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Relative speed = ${S1}+${S2} km/h = ${((S1 + S2) * 1000 / 3600).toFixed(2)} m/s; time = total length / relative speed = ${(L1 + L2)} / ${(rel).toFixed(2)} ≈ ${tSec} s.`
  };
}

function generateClockAngleProblem() {
  const H = randomInt(1, 12);
  const M = randomInt(0, 59);
  const angle = Math.abs(30 * H - 5.5 * M);
  const theta = Math.min(angle, 360 - angle);
  const thetaStr = theta.toFixed(1);
  const question = `Find the smaller angle between the hour and minute hands at ${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}.`;
  const options = shuffle([
    `${thetaStr}`,
    `${(parseFloat(thetaStr) + randomInt(5, 15)).toFixed(1)}`,
    `${Math.max(0, parseFloat(thetaStr) - randomInt(5, 15)).toFixed(1)}`,
    `${(180 - parseFloat(thetaStr)).toFixed(1)}`
  ]);
  const answerIndex = options.indexOf(`${thetaStr}`);
  return {
    id: `clock-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'reasoning',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `Angle = |30H − 5.5M|, choose the smaller with 360 − angle ⇒ ${thetaStr}°.`
  };
}

function generateSyllogismProblem() {
  const bank = [
    {
      st: ['All cats are animals.', 'Some animals are pets.'],
      cn: ['Some cats may be pets.', 'No animals are cats.'],
      ans: 'Only I follows'
    },
    {
      st: ['All cars are vehicles.', 'No vehicle is a toy.'],
      cn: ['No car is a toy.', 'Some cars are toys.'],
      ans: 'Only I follows'
    },
    {
      st: ['Some students are athletes.', 'All athletes are disciplined.'],
      cn: ['Some students are disciplined.', 'No student is disciplined.'],
      ans: 'Only I follows'
    }
  ];
  const pick = bank[randomInt(0, bank.length - 1)];
  const question = `Statements: 1) ${pick.st[0]} 2) ${pick.st[1]}\nConclusions: I) ${pick.cn[0]} II) ${pick.cn[1]}`;
  const options = shuffle(['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither I nor II follows']);
  const answerIndex = options.indexOf(pick.ans);
  return {
    id: `syll-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    category: 'reasoning',
    difficulty: 'advanced',
    question,
    options,
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
    explanation: `By basic Venn logic for syllogisms, the correct option is: ${pick.ans}.`
  };
}

// ---------------- Selection logic with bias towards advanced ----------------
function generateProblem() {
  const easy = [
    generatePercentageProblem,
    generateSpeedDistanceProblem,
    generateAverageProblem,
    generateProfitAndLossProblem,
    generateDirectionsProblem,
    generateCaseStudyProblem,
    generateSeatingArrangementProblem,
    generateLogicalReasoningProblem,
    generateAgeProblem,
    generateRelationshipsProblem,
    generateBoatsAndStreamsProblem,
    generateVerbalAnalogyProblem
  ];

  const advanced = [
    generateCompoundInterestProblem,
    generateSuccessiveDiscountsProblem,
    generateMixtureAlligationProblem,
    generateTimeAndWorkProblem,
    generatePipesAndCisternsProblem,
    generatePermutationCombinationProblem,
    generateProbabilityProblem,
    generateTrainsRelativeSpeedProblem,
    generateClockAngleProblem,
    generateSyllogismProblem
  ];

  const pickAdvanced = Math.random() < 0.7; // 70% advanced bias
  const pool = pickAdvanced ? advanced : [...easy, ...advanced];
  const gen = pool[randomInt(0, pool.length - 1)];
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
