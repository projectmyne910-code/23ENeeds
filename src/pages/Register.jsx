
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Register.css'

function Register() {
  const [role, setRole] = useState('customer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(event) {
    event.preventDefault()
    setMessage('')

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            requested_role: role,
          },
        },
      })

      if (error) throw error

      if (data.session) {
        setMessage(
          'Account created! You can now sign in.'
        )
      } else {
        setMessage(
          'Registration received! Check your email to confirm your account before signing in.'
        )
      }

      setName('')
      setEmail('')
      setPassword('')
    } catch (error) {
      setMessage(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <a href="/" className="register-logo">
          23ENeeDs<span>.</span>
        </a>

        <p className="register-tagline">everything you need</p>

        <h1>Create your account</h1>
        <p className="register-intro">
          Join your local community marketplace.
        </p>

        <div className="role-options">
          {[
            ['customer', 'Customer'],
            ['vendor', 'Vendor'],
            ['delivery_partner', 'Delivery Partner'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={role === value ? 'role-active' : ''}
              onClick={() => setRole(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegister}>
          <label htmlFor="full-name">Full name</label>
          <input
            id="full-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your full name"
            maxLength={100}
            required
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />

          <button
            className="register-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {message && (
          <p className="register-message" role="status">
            {message}
          </p>
        )}

        <p className="register-footer">
          Already registered? <a href="/login">Sign in</a>
        </p>
      </div>
    </main>
  )
}

export default Register
