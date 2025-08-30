// Simple test to verify the word API works from the frontend
async function testWordAPI() {
  try {
    console.log('Testing word API from frontend...');
    
    const response = await fetch('http://localhost:3001/api/word-of-the-day');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Word API response:', data);
    return data;
  } catch (error) {
    console.error('Error testing word API:', error);
    return null;
  }
}

// Run the test
testWordAPI();

export default testWordAPI;