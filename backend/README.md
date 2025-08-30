# My Life Dashboard Backend

This is the backend server for the My Life Dashboard application, specifically providing word data for the Word of the Day widget.

## Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```
   
   Or for development with auto-restart:
   ```
   npm run dev
   ```

The server will start on port 3001 by default.

## API Endpoints

### Get Word of the Day
- **URL**: `/api/word-of-the-day`
- **Method**: `GET`
- **Description**: Returns a random word from the collection with its definition, pronunciation, and example
- **Response**:
  ```json
  {
    "word": "serendipity",
    "pronunciation": "ser-en-DIP-i-tee",
    "definition": "The occurrence of events by chance in a happy or beneficial way",
    "example": "Finding my favorite book at the flea market was a delightful serendipity."
  }
  ```

### Get All Words
- **URL**: `/api/words`
- **Method**: `GET`
- **Description**: Returns the list of all words in the collection
- **Response**:
  ```json
  [
    "serendipity",
    "ephemeral",
    "ubiquitous"
  ]
  ```

### Add a Word
- **URL**: `/api/words`
- **Method**: `POST`
- **Description**: Adds a new word to the collection
- **Request Body**:
  ```json
  {
    "word": "example"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Word added successfully",
    "word": "example"
  }
  ```

### Remove a Word
- **URL**: `/api/words/:word`
- **Method**: `DELETE`
- **Description**: Removes a word from the collection
- **Response**:
  ```json
  {
    "message": "Word removed successfully"
  }
  ```

## Adding Words Manually

To manually add words to the collection, you have two options:

1. **Using the API**: Make a POST request to `/api/words` with the word in the request body as shown above.

2. **Directly in the code**: Edit the `wordCollection` array in `server.js` and add your words to the array:
   ```javascript
   let wordCollection = [
     "serendipity",
     "ephemeral",
     "ubiquitous",
     // Add your words here
     "your-new-word"
   ];
   ```

## How It Works

The server maintains an array of words that can be manually entered. When a request is made to `/api/word-of-the-day`, the server:

1. Selects a random word from the collection
2. Calls the Free Dictionary API to fetch the word's meaning, pronunciation, and example
3. Returns the formatted data to the frontend

If the dictionary API is unavailable, the server will return a basic response with the word and default values for the other fields.

## Environment Variables

- `PORT`: The port the server will run on (default: 3001)