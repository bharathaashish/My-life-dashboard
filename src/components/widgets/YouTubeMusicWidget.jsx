import React, { useState } from 'react';
import YouTube from 'react-youtube';

const YouTubeMusicWidget = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = 'AIzaSyBSLb6K1AMNs84PdBZrp-9I2mnsHSo8brs';

  const searchVideos = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(
          searchQuery
        )}&type=video&videoCategoryId=10&key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (err) {
      setError('Failed to search videos. Please try again.');
      console.error('YouTube API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchVideos();
    }
  };

  const playVideo = (video) => {
    setCurrentVideo(video);
  };

  const stopVideo = () => {
    setCurrentVideo(null);
  };

  // YouTube player options
  const playerOptions = {
    height: '200',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <section
      id="youtube-music-widget"
      data-widget="youtube-music-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[360px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent">
        <h2 className="text-xl font-semibold">YouTube Music</h2>
      </div>
      
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        {/* Search Section */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for songs or artists..."
            className="flex-1 px-3 py-2 text-sm dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            onClick={searchVideos}
            disabled={isLoading || !searchQuery.trim()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Current Video Player */}
        {currentVideo && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium truncate">
                Now Playing: {currentVideo.snippet.title}
              </h3>
              <button
                onClick={stopVideo}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
              >
                Stop
              </button>
            </div>
            <div className="rounded-lg overflow-hidden">
              <YouTube
                videoId={currentVideo.id.videoId}
                opts={playerOptions}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-2">Search Results:</h3>
              {searchResults.map((video) => (
                <div
                  key={video.id.videoId}
                  onClick={() => playVideo(video)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <img
                    src={video.snippet.thumbnails.default.url}
                    alt={video.snippet.title}
                    className="w-12 h-9 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {video.snippet.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {video.snippet.channelTitle}
                    </p>
                  </div>
                  <button className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/80 transition-colors flex-shrink-0">
                    Play
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {searchResults.length === 0 && !isLoading && !error && (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm text-center">
              <div>
                <div className="text-4xl mb-2">🎵</div>
                <p>Search for your favorite songs or artists</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Searching for music...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default YouTubeMusicWidget;