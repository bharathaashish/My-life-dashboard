import React, { useState } from 'react';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onRegister(data.user, data.token);
      } else {
        setError(data.error || data.errors?.[0]?.msg || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light-bg to-light-accent dark:from-dark-bg dark:to-dark-accent">
      <div className="max-w-md w-full mx-4">
        <div className="bg-light-widget dark:bg-dark-widget rounded-2xl shadow-widget dark:shadow-widget-dark p-8 backdrop-blur-sm border border-white/20 dark:border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-light-text dark:text-dark-text mb-2">
              Create Account
            </h1>
            <p className="text-light-text/70 dark:text-dark-text/70">
              Sign up for your personal dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-light-accent/30 dark:border-dark-accent/30 bg-white/50 dark:bg-dark-widget/50 text-light-text dark:text-dark-text placeholder-light-text/50 dark:placeholder-dark-text/50 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-light-accent/30 dark:border-dark-accent/30 bg-white/50 dark:bg-dark-widget/50 text-light-text dark:text-dark-text placeholder-light-text/50 dark:placeholder-dark-text/50 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent transition-all duration-200"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-light-accent/30 dark:border-dark-accent/30 bg-white/50 dark:bg-dark-widget/50 text-light-text dark:text-dark-text placeholder-light-text/50 dark:placeholder-dark-text/50 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent transition-all duration-200"
                placeholder="Confirm your password"
              />
            </div>

            {error && (
              <div className="bg-light-error/10 dark:bg-dark-error/10 border border-light-error/30 dark:border-dark-error/30 rounded-lg p-3">
                <p className="text-light-error dark:text-dark-error text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-light-primary dark:bg-dark-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-light-primary/90 dark:hover:bg-dark-primary/90 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:ring-offset-2 focus:ring-offset-light-widget dark:focus:ring-offset-dark-widget transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-light-text/70 dark:text-dark-text/70">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-light-primary dark:text-dark-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;