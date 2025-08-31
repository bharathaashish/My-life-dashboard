import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const CollaborativeTodoWidget = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Chat-related state
  const [activeTab, setActiveTab] = useState('todo');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatTypingUsers, setChatTypingUsers] = useState([]);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const chatTypingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Common emojis for quick access
  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '😎', '🤝', '👏', '🙌', '💪', '✨'];

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3002');
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to collaborative server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from collaborative server');
    });

    newSocket.on('session-joined', (data) => {
      setCurrentSession(data.session);
      setTasks(data.session.tasks || []);
      setUsers(data.session.users || []);
      setMessages(data.session.messages || []);
      setError(null);
    });

    newSocket.on('user-joined', (data) => {
      setUsers(data.session.users);
    });

    newSocket.on('user-left', (data) => {
      setUsers(data.session.users);
    });

    newSocket.on('task-added', (data) => {
      setTasks(data.session.tasks);
    });

    newSocket.on('task-updated', (data) => {
      setTasks(data.session.tasks);
    });

    newSocket.on('task-deleted', (data) => {
      setTasks(data.session.tasks);
    });

    newSocket.on('user-typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(u => u !== data.userName), data.userName]);
      } else {
        setTypingUsers(prev => prev.filter(u => u !== data.userName));
      }
    });

    // Chat event listeners
    newSocket.on('message-received', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    newSocket.on('chat-typing', (data) => {
      if (data.isTyping) {
        setChatTypingUsers(prev => [...prev.filter(u => u !== data.userName), data.userName]);
      } else {
        setChatTypingUsers(prev => prev.filter(u => u !== data.userName));
      }
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load saved session from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('collaborative-session');
    const savedUserName = localStorage.getItem('collaborative-username');
    
    if (savedSession && savedUserName) {
      const sessionData = JSON.parse(savedSession);
      setUserName(savedUserName);
      setSessionId(sessionData.id);
      // Auto-rejoin if socket is connected
      if (socket && isConnected) {
        joinSession(sessionData.id, savedUserName);
      }
    }
  }, [socket, isConnected]);

  const createSession = async () => {
    if (!sessionName.trim() || !userName.trim()) {
      setError('Please enter both session name and your name');
      return;
    }

    setIsCreatingSession(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3002/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: sessionName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      
      // Save to localStorage
      localStorage.setItem('collaborative-session', JSON.stringify(data.session));
      localStorage.setItem('collaborative-username', userName.trim());
      
      // Join the session
      joinSession(data.sessionId, userName.trim());
      
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error('Create session error:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const joinSession = (sessionIdToJoin, userNameToUse) => {
    if (!socket || !sessionIdToJoin.trim() || !userNameToUse.trim()) {
      setError('Please enter both session ID and your name');
      return;
    }

    setError(null);
    socket.emit('join-session', {
      sessionId: sessionIdToJoin.trim(),
      userName: userNameToUse.trim()
    });
  };

  const handleJoinSession = () => {
    if (!sessionId.trim() || !userName.trim()) {
      setError('Please enter both session ID and your name');
      return;
    }

    setIsJoiningSession(true);
    
    // Save to localStorage
    localStorage.setItem('collaborative-session', JSON.stringify({ id: sessionId.trim() }));
    localStorage.setItem('collaborative-username', userName.trim());
    
    joinSession(sessionId.trim(), userName.trim());
    setIsJoiningSession(false);
  };

  const addTask = () => {
    if (!newTaskText.trim() || !currentSession) return;

    socket.emit('add-task', {
      sessionId: currentSession.id,
      task: {
        text: newTaskText.trim(),
        createdBy: userName
      }
    });

    setNewTaskText('');
    handleTypingStop();
  };

  const toggleTask = (taskId, completed) => {
    if (!currentSession) return;

    socket.emit('update-task', {
      sessionId: currentSession.id,
      taskId,
      updates: {
        completed,
        completedBy: completed ? userName : null
      }
    });
  };

  const deleteTask = (taskId) => {
    if (!currentSession) return;

    socket.emit('delete-task', {
      sessionId: currentSession.id,
      taskId
    });
  };

  const handleTypingStart = () => {
    if (!isTyping && currentSession) {
      setIsTyping(true);
      socket.emit('user-typing', {
        sessionId: currentSession.id,
        userName,
        isTyping: true
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);
  };

  const handleTypingStop = () => {
    if (isTyping && currentSession) {
      setIsTyping(false);
      socket.emit('user-typing', {
        sessionId: currentSession.id,
        userName,
        isTyping: false
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTaskInputChange = (e) => {
    setNewTaskText(e.target.value);
    handleTypingStart();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // Chat functions
  const sendMessage = () => {
    if (!newMessage.trim() || !currentSession) return;

    socket.emit('send-message', {
      sessionId: currentSession.id,
      message: {
        text: newMessage.trim(),
        sender: userName
      }
    });

    setNewMessage('');
    handleChatTypingStop();
    setShowEmojiPicker(false);
  };

  const handleChatTypingStart = () => {
    if (!isChatTyping && currentSession) {
      setIsChatTyping(true);
      socket.emit('chat-typing', {
        sessionId: currentSession.id,
        userName,
        isTyping: true
      });
    }

    // Clear existing timeout
    if (chatTypingTimeoutRef.current) {
      clearTimeout(chatTypingTimeoutRef.current);
    }

    // Set new timeout
    chatTypingTimeoutRef.current = setTimeout(() => {
      handleChatTypingStop();
    }, 1000);
  };

  const handleChatTypingStop = () => {
    if (isChatTyping && currentSession) {
      setIsChatTyping(false);
      socket.emit('chat-typing', {
        sessionId: currentSession.id,
        userName,
        isTyping: false
      });
    }

    if (chatTypingTimeoutRef.current) {
      clearTimeout(chatTypingTimeoutRef.current);
    }
  };

  const handleMessageInputChange = (e) => {
    setNewMessage(e.target.value);
    handleChatTypingStart();
  };

  const handleMessageKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const leaveSession = () => {
    if (socket && currentSession) {
      socket.disconnect();
      socket.connect();
    }
    setCurrentSession(null);
    setTasks([]);
    setUsers([]);
    setMessages([]);
    setSessionId('');
    setTypingUsers([]);
    setChatTypingUsers([]);
    localStorage.removeItem('collaborative-session');
  };

  const copySessionLink = () => {
    if (currentSession) {
      const link = `Session ID: ${currentSession.id}`;
      navigator.clipboard.writeText(link).then(() => {
        // Could add a toast notification here
        console.log('Session ID copied to clipboard');
      });
    }
  };

  // Connection status indicator
  const getConnectionStatus = () => {
    if (!isConnected) return { color: 'bg-red-500', text: 'Disconnected' };
    if (currentSession) return { color: 'bg-green-500', text: 'Connected' };
    return { color: 'bg-yellow-500', text: 'Not in session' };
  };

  const connectionStatus = getConnectionStatus();

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section
      id="collaborative-todo-widget"
      data-widget="collaborative-todo-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[360px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent flex justify-between items-center">
        <h2 className="text-xl font-semibold">Collaborative Todo & Chat</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionStatus.color}`} title={connectionStatus.text}></div>
          {currentSession && (
            <button
              onClick={copySessionLink}
              className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/80 transition-colors"
              title="Copy Session ID"
            >
              Share
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        {!currentSession ? (
          // Session creation/joining interface
          <div className="space-y-4">
            {error && (
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-3 py-2 text-sm dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Create New Session</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Session name..."
                    className="flex-1 px-3 py-2 text-sm dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={createSession}
                    disabled={isCreatingSession || !isConnected}
                    className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
                  >
                    {isCreatingSession ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">or</div>

              <div>
                <label className="block text-sm font-medium mb-1">Join Existing Session</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="Session ID..."
                    className="flex-1 px-3 py-2 text-sm dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleJoinSession}
                    disabled={isJoiningSession || !isConnected}
                    className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/80 transition-colors text-sm disabled:opacity-50"
                  >
                    {isJoiningSession ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            </div>

            {!isConnected && (
              <div className="text-center text-sm text-yellow-600 dark:text-yellow-400">
                Connecting to server...
              </div>
            )}
          </div>
        ) : (
          // Active session interface
          <div className="flex flex-col h-full">
            {/* Session info */}
            <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">{currentSession.name}</div>
                  <div className="text-xs text-gray-500">ID: {currentSession.id}</div>
                </div>
                <button
                  onClick={leaveSession}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  Leave
                </button>
              </div>
              
              {/* Active users */}
              <div className="mt-2 flex flex-wrap gap-1">
                {users.map((user) => (
                  <span
                    key={user.id}
                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full"
                  >
                    {user.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('todo')}
                className={`flex-1 py-1 px-2 text-sm rounded-md transition-colors ${
                  activeTab === 'todo'
                    ? 'bg-white dark:bg-gray-700 text-primary font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                📝 Todo
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1 px-2 text-sm rounded-md transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-gray-700 text-primary font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                💬 Chat
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'todo' ? (
              // Todo Tab Content
              <div className="flex flex-col flex-1">
                {/* Add task input */}
                <div className="mb-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={handleTaskInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a new task..."
                      className="flex-1 px-3 py-2 text-sm dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={addTask}
                      className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/80 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}
                </div>

                {/* Tasks list */}
                <div className="flex-1 overflow-y-auto">
                  {tasks.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No tasks yet. Add one above!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => toggleTask(task.id, e.target.checked)}
                            className="rounded"
                          />
                          <span
                            className={`flex-1 text-sm ${
                              task.completed ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {task.text}
                          </span>
                          <div className="text-xs text-gray-500">
                            {task.completed ? task.completedBy : task.createdBy}
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Chat Tab Content
              <div className="flex flex-col flex-1">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-3 space-y-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === userName ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-2 rounded-lg text-sm ${
                            message.sender === userName
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {message.sender !== userName && (
                            <div className="text-xs opacity-70 mb-1">{message.sender}</div>
                          )}
                          <div>{message.text}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat typing indicator */}
                {chatTypingUsers.length > 0 && (
                  <div className="text-xs text-gray-500 mb-2">
                    {chatTypingUsers.join(', ')} {chatTypingUsers.length === 1 ? 'is' : 'are'} typing...
                  </div>
                )}

                {/* Emoji picker */}
                {showEmojiPicker && (
                  <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="text-lg hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message input */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors"
                    title="Add emoji"
                  >
                    😀
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleMessageInputChange}
                    onKeyPress={handleMessageKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/80 transition-colors text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CollaborativeTodoWidget;