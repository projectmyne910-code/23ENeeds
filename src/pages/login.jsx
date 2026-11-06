
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut()
        setMessage('Please confirm your email before signing in.')
        return
      }

      // Check the user's role from the database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, approval_status')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      setMessage('Login successful! Welcome to 23ENeeDs.')

      // Admin → Admin Dashboard
      if (
        profile.role === 'admin' &&
        profile.approval_status === 'approved'
      ) {
        window.location.href = '/admin'
        return
      }

      // Everyone else → normal dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      setMessage(error.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset() {
    setMessage('')

    if (!email.trim()) {
      setMessage('Enter your email address first.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )

      if (error) throw error

      setMessage('If the account exists, a password reset email will be sent.')
    } catch (error) {
      setMessage(error.message || 'Unable to request a password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <a href="/" className="login-logo">23ENeeDs<span>.</span></a>
        <p className="login-tagline">everything you need</p>

        <h1>Welcome back!</h1>
        <p className="login-intro">
          Sign in to your local marketplace account.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button
          className="forgot-password"
          type="button"
          disabled={loading}
          onClick={handlePasswordReset}
        >
          Forgot your password?
        </button>

        {message && (
          <p className="login-message" role="status">{message}</p>
        )}

        <p className="login-footer">
          Don't have an account? <a href="/register">Create one</a>
        </p>
      </div>
    </main>
  )
}

export default Login