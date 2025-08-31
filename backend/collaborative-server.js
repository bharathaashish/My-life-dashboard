import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage for sessions (in production, use a database)
const sessions = new Map();
const userSessions = new Map(); // Track which users are in which sessions

// Generate a new session
app.post('/api/create-session', (req, res) => {
  const sessionId = uuidv4().substring(0, 8); // Short session ID
  const session = {
    id: sessionId,
    name: req.body.name || `Session ${sessionId}`,
    tasks: [],
    users: [],
    messages: [],
    createdAt: new Date().toISOString()
  };
  
  sessions.set(sessionId, session);
  
  res.json({
    sessionId,
    sessionLink: `${req.protocol}://${req.get('host')}/session/${sessionId}`,
    session
  });
});

// Get session info
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a session
  socket.on('join-session', (data) => {
    const { sessionId, userName } = data;
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    // Add user to session
    const user = {
      id: socket.id,
      name: userName || `User ${socket.id.substring(0, 6)}`,
      joinedAt: new Date().toISOString()
    };

    // Remove user from previous session if exists
    const previousSession = userSessions.get(socket.id);
    if (previousSession) {
      socket.leave(previousSession);
      const prevSession = sessions.get(previousSession);
      if (prevSession) {
        prevSession.users = prevSession.users.filter(u => u.id !== socket.id);
        socket.to(previousSession).emit('user-left', { user, session: prevSession });
      }
    }

    // Add to new session
    session.users = session.users.filter(u => u.id !== socket.id); // Remove if already exists
    session.users.push(user);
    userSessions.set(socket.id, sessionId);
    
    socket.join(sessionId);
    
    // Send current session state to the user
    socket.emit('session-joined', { session });
    
    // Notify other users in the session
    socket.to(sessionId).emit('user-joined', { user, session });
    
    console.log(`User ${user.name} joined session ${sessionId}`);
  });

  // Add a new task
  socket.on('add-task', (data) => {
    const { sessionId, task } = data;
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    const newTask = {
      id: uuidv4(),
      text: task.text,
      completed: false,
      createdBy: task.createdBy,
      createdAt: new Date().toISOString(),
      completedBy: null,
      completedAt: null
    };

    session.tasks.push(newTask);
    
    // Broadcast to all users in the session
    io.to(sessionId).emit('task-added', { task: newTask, session });
    
    console.log(`Task added to session ${sessionId}:`, newTask.text);
  });

  // Update task (toggle completion, edit text)
  socket.on('update-task', (data) => {
    const { sessionId, taskId, updates } = data;
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    const taskIndex = session.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      socket.emit('error', { message: 'Task not found' });
      return;
    }

    const task = session.tasks[taskIndex];
    
    // Update task properties
    if (updates.hasOwnProperty('completed')) {
      task.completed = updates.completed;
      if (updates.completed) {
        task.completedBy = updates.completedBy;
        task.completedAt = new Date().toISOString();
      } else {
        task.completedBy = null;
        task.completedAt = null;
      }
    }
    
    if (updates.hasOwnProperty('text')) {
      task.text = updates.text;
    }

    session.tasks[taskIndex] = task;
    
    // Broadcast to all users in the session
    io.to(sessionId).emit('task-updated', { task, session });
    
    console.log(`Task updated in session ${sessionId}:`, task.id);
  });

  // Delete a task
  socket.on('delete-task', (data) => {
    const { sessionId, taskId } = data;
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    const taskIndex = session.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      socket.emit('error', { message: 'Task not found' });
      return;
    }

    const deletedTask = session.tasks.splice(taskIndex, 1)[0];
    
    // Broadcast to all users in the session
    io.to(sessionId).emit('task-deleted', { taskId, session });
    
    console.log(`Task deleted from session ${sessionId}:`, deletedTask.text);
  });

  // Handle user typing (for real-time typing indicators)
  socket.on('user-typing', (data) => {
    const { sessionId, userName, isTyping } = data;
    socket.to(sessionId).emit('user-typing', { userName, isTyping });
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    const { sessionId, message } = data;
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    const newMessage = {
      id: uuidv4(),
      text: message.text,
      sender: message.sender,
      timestamp: new Date().toISOString()
    };

    // Initialize messages array if it doesn't exist
    if (!session.messages) {
      session.messages = [];
    }

    session.messages.push(newMessage);
    
    // Broadcast to all users in the session
    io.to(sessionId).emit('message-received', { message: newMessage, session });
    
    console.log(`Message sent in session ${sessionId} by ${newMessage.sender}:`, newMessage.text);
  });

  // Handle chat typing indicators
  socket.on('chat-typing', (data) => {
    const { sessionId, userName, isTyping } = data;
    socket.to(sessionId).emit('chat-typing', { userName, isTyping });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const sessionId = userSessions.get(socket.id);
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        const user = session.users.find(u => u.id === socket.id);
        session.users = session.users.filter(u => u.id !== socket.id);
        
        // Notify other users
        socket.to(sessionId).emit('user-left', { user, session });
        
        console.log(`User ${user?.name || socket.id} left session ${sessionId}`);
      }
      userSessions.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Collaborative server running on port ${PORT}`);
});

export { app, server, io };