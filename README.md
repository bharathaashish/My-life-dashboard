# My Life Dashboard

A small personal dashboard with To-Do, Pomodoro timer, Notes, and Calendar widgets.

Quick start

1. Install dependencies:

```powershell
npm install
```

2. Build Tailwind (dev/watch):

```powershell
npm run dev
```

3. Serve the folder and open in browser (recommended):

```powershell
npx http-server -p 8080
# then open http://localhost:8080
```

Notes

- The app stores data in localStorage (tasks, notes, calendar events).
- If Tailwind CSS output is needed, run the build command above to regenerate `css/style.css` from `css/input.css`.

## Backend Server

This project now includes a backend server for the Word of the Day widget:

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the backend server:
   ```
   npm start
   ```
   
   Or for development with auto-restart:
   ```
   npm run dev
   ```

The backend server will start on port 3001 by default.

## Adding Words

To manually add words to the Word of the Day collection, you have two options:

1. **Using the API**: Make a POST request to `http://localhost:3001/api/words` with the word in the request body.

2. **Directly in the code**: Edit the `wordCollection` array in `backend/server.js` and add your words to the array.

For more details about the backend API, see `backend/README.md`.
