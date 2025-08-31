import { initializeDatabase } from './database.js';

// Test the database initialization
async function testDatabase() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully!');
    console.log('🚀 Authentication system is ready to use.');
    console.log('\nAvailable endpoints:');
    console.log('POST /api/auth/register - Register a new user');
    console.log('POST /api/auth/login - Login with email and password');
    console.log('GET /api/auth/me - Get current user info (requires token)');
    console.log('POST /api/auth/logout - Logout (client-side token removal)');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

testDatabase();