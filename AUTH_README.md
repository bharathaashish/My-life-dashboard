# Authentication System

This dashboard now includes a complete authentication system with user registration, login, and secure access control.

## Features

- **User Registration**: Create new accounts with email and password
- **User Login**: Secure login with JWT tokens
- **Password Security**: Passwords are hashed using bcrypt
- **Token-based Authentication**: JWT tokens for secure API access
- **Persistent Sessions**: Login state persists across browser sessions
- **SQLite Database**: Local database for user storage
- **Beautiful UI**: Styled login/register forms matching the dashboard theme

## Database

The system uses SQLite database (`backend/dashboard.db`) with the following structure:

### Users Table
- `id` - Primary key (auto-increment)
- `email` - Unique email address
- `password` - Hashed password (bcrypt)
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp

## API Endpoints

### Authentication Routes (Base: `/api/auth`)

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### POST `/api/auth/login`
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### GET `/api/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-01T12:00:00.000Z"
  }
}
```

#### POST `/api/auth/logout`
Logout (client-side token removal).

## Frontend Components

### Login Component (`src/components/Login.jsx`)
- Email and password input fields
- Form validation and error handling
- Switch to registration form
- Responsive design with theme support

### Register Component (`src/components/Register.jsx`)
- Email, password, and confirm password fields
- Client-side validation
- Switch to login form
- Responsive design with theme support

### AuthContext (`src/contexts/AuthContext.jsx`)
- Global authentication state management
- Token persistence in localStorage
- Automatic token verification
- Login/logout functions

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
2. **JWT Tokens**: Secure token-based authentication with 24-hour expiration
3. **Input Validation**: Server-side validation using express-validator
4. **SQL Injection Protection**: Parameterized queries prevent SQL injection
5. **CORS Protection**: Cross-origin request protection

## Usage

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the Frontend:**
   ```bash
   npm run dev
   ```

3. **Access the Application:**
   - Open your browser to the frontend URL
   - You'll see the login page
   - Register a new account or login with existing credentials
   - Upon successful authentication, you'll access the dashboard

## Environment Variables

For production, set these environment variables:

```bash
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

## File Structure

```
backend/
├── database.js          # Database setup and operations
├── auth.js             # Authentication routes and middleware
├── server.js           # Main server file (updated with auth)
└── dashboard.db        # SQLite database (created automatically)

src/
├── components/
│   ├── Login.jsx       # Login form component
│   ├── Register.jsx    # Registration form component
│   └── Header.jsx      # Updated header with logout
├── contexts/
│   └── AuthContext.jsx # Authentication context
└── App.jsx            # Updated main app with auth flow
```

## Testing

Test the authentication system:

```bash
cd backend
node test-auth.js
```

This will verify that the database is properly initialized and ready to use.

## Troubleshooting

1. **Database Issues**: Delete `backend/dashboard.db` and restart the server to recreate the database
2. **Token Issues**: Clear localStorage in browser developer tools
3. **CORS Issues**: Ensure the backend server is running on port 3001
4. **Dependencies**: Run `npm install` in both root and backend directories