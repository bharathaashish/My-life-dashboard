const axios = require('axios');

async function testServer() {
  try {
    console.log('Testing backend server...');
    
    // Test getting all words
    console.log('\n1. Testing GET /api/words');
    let response = await axios.get('http://localhost:3001/api/words');
    console.log('Current words in collection:', response.data);
    
    // Test getting word of the day
    console.log('\n2. Testing GET /api/word-of-the-day');
    response = await axios.get('http://localhost:3001/api/word-of-the-day');
    console.log('Word of the day:', response.data);
    
    // Test adding a new word
    console.log('\n3. Testing POST /api/words');
    response = await axios.post('http://localhost:3001/api/words', { word: 'test' });
    console.log('Add word result:', response.data);
    
    // Test getting all words again
    console.log('\n4. Testing GET /api/words again');
    response = await axios.get('http://localhost:3001/api/words');
    console.log('Words in collection after adding:', response.data);
    
    // Test removing a word
    console.log('\n5. Testing DELETE /api/words/test');
    response = await axios.delete('http://localhost:3001/api/words/test');
    console.log('Delete word result:', response.data);
    
    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testServer();