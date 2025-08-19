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
