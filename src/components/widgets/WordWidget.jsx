import React, { useState, useEffect } from 'react';

const WordWidget = () => {
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch word of the day from backend
  const fetchWordOfTheDay = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/word-of-the-day');
      if (!response.ok) {
        throw new Error('Failed to fetch word of the day');
      }
      const data = await response.json();
      console.log('Received word data from backend:', data);
      return data;
    } catch (error) {
      console.error('Error fetching word of the day:', error);
      // Fallback to a default word if API fails
      const fallback = {
        word: "Serendipity",
        pronunciation: "ser-en-DIP-i-tee",
        definition: "The occurrence of events by chance in a happy or beneficial way",
        example: "Finding my favorite book at the flea market was a delightful serendipity."
      };
      console.log('Using fallback word data:', fallback);
      return fallback;
    }
  };

  // Function to speak the word using Web Speech API
  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // Slightly slower for clarity
      speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech Synthesis not supported in this browser');
    }
  };

  // Function to refresh and get a new word
  const refreshWord = async () => {
    try {
      setLoading(true);
      const data = await fetchWordOfTheDay();
      setWordData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading word of the day:', error);
      setLoading(false);
    }
  };

  // Initialize word widget with word of the day from backend
  useEffect(() => {
    const loadWordOfTheDay = async () => {
      try {
        setLoading(true);
        const data = await fetchWordOfTheDay();
        setWordData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading word of the day:', error);
        setLoading(false);
      }
    };
    
    loadWordOfTheDay();
  }, []);

  return (
    <section
      id="word-widget"
      data-widget="word-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[360px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent flex justify-between items-center">
        <h2 className="text-xl font-semibold">Word of the Day</h2>
        <button
          onClick={refreshWord}
          className="text-sm bg-primary dark:text-dark-text light:text-light-text px-2 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300"
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      <div className="flex-1 p-4 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div id="word-content" className="text-center">
            {loading ? (
              <div id="word-loading" className="text-lg">Loading word...</div>
            ) : wordData ? (
              <div id="word-display">
                <h3 id="word-word" className="text-2xl font-bold mb-2 text-primary">
                  {wordData.word}
                </h3>
                <p id="word-pronunciation" className="text-lg italic mb-3">
                  {wordData.pronunciation}
                </p>
                <p id="word-definition" className="mb-4">
                  {wordData.definition}
                </p>
                <p id="word-example" className="italic dark:text-dark-text/80 light:text-light-text/80 p-4 border-l-4 border-primary bg-primary/10 dark:bg-primary/15 rounded-r">
                  "{wordData.example}"
                </p>
                <button
                  id="word-speak"
                  onClick={() => speakWord(wordData.word)}
                  className="mt-3 bg-primary dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
                >
                  🔊 Pronounce
                </button>
              </div>
            ) : (
              <div id="word-loading" className="text-lg text-error">Failed to load word</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WordWidget;