import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());

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
