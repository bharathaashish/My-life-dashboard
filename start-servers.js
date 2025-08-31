const { spawn } = require('child_process');
const path = require('path');

console.log('Starting servers...');

// Start the main backend server
const mainServer = spawn('node', ['backend/server.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Start the collaborative server
const collaborativeServer = spawn('node', ['backend/collaborative-server.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  mainServer.kill('SIGINT');
  collaborativeServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down servers...');
  mainServer.kill('SIGTERM');
  collaborativeServer.kill('SIGTERM');
  process.exit(0);
});

mainServer.on('close', (code) => {
  console.log(`Main server exited with code ${code}`);
});

collaborativeServer.on('close', (code) => {
  console.log(`Collaborative server exited with code ${code}`);
});

console.log('Main server running on port 3001');
console.log('Collaborative server running on port 3002');
console.log('Press Ctrl+C to stop both servers');