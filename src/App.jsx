
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Register from './pages/Register'
import Login from './pages/login'
import Dashboard from './pages/Dashboard'
import Category from './pages/Category'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import AdminDashboard from "./pages/AdminDashboard";
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setIsLoggedIn(!!data.session)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsLoggedIn(!!session)
  })

  return () => subscription.unsubscribe()
}, [])
  if (window.location.pathname === '/register') {
    return <Register />
  }
   if (window.location.pathname === '/login') {
    return <Login />
  }
  if (window.location.pathname === '/dashboard') {
    return <Dashboard />
  }
  if (window.location.pathname.startsWith('/category')) {
    return <Category />
  }
  if (window.location.pathname === '/cart') {
    return <Cart />
  }
  if (window.location.pathname === '/checkout') {
    return <Checkout />
  }
  if (window.location.pathname === '/admin') {
    return <AdminDashboard />
  }
  return (
    <div className="app">
      <header className="navbar">
        <a href="#home" className="logo">
          23ENeeDs<span>.</span>
          <small>everything you need</small>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#vendor">Become a Vendor</a>
          <a href="#delivery">Become a Delivery Partner</a>
          <a
             href={isLoggedIn ? '/dashboard' : '/login'}
             className="login-nav-btn"
            >
            {isLoggedIn ? 'My Dashboard' : 'Sign In'}
          </a>
          <a href="#download" className="download-btn">
           Download App
          </a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">
              YOUR TOWN. YOUR PEOPLE. YOUR MARKETPLACE.
            </p>

            <h1>
              Everything you need,
              <span> closer to you.</span>
            </h1>

            <p className="hero-description">
              Discover local shops, everyday essentials and trusted
              services from your own community.
            </p>

            <div className="hero-actions">
              <a href="#categories" className="primary-btn">
                Explore Marketplace →
              </a>
              <a href="#vendor" className="secondary-btn">
                Start Selling
              </a>
            </div>

            <p className="commission">
              ✨ Local businesses welcome · 0% vendor commission
            </p>
          </div>

          <div className="hero-art">
            <div className="art-circle">
              <span className="art-icon">🛍️</span>
              <span className="floating-icon icon-one">🥦</span>
              <span className="floating-icon icon-two">📦</span>
              <span className="floating-icon icon-three">🚚</span>
              <span className="floating-icon icon-four">🏪</span>
            </div>

            <div className="art-caption">
              <strong>Made for your community</strong>
              <p>Local shopping, made simpler.</p>
            </div>
          </div>
        </section>

        <section className="categories" id="categories">
          <p className="eyebrow">DISCOVER YOUR NEIGHBOURHOOD</p>
          <h2>What do you need today?</h2>

          <div className="category-grid">
            <a href="/category/groceries" className="category-card">
              <span>🥬</span>
              <strong>Groceries</strong>
              <small>Everyday essentials</small>
            </a>

            <a href="/category/fashion" className="category-card">
              <span>👕</span>
              <strong>Fashion</strong>
              <small>Style close to home</small>
            </a>

            <a href="/category/food" className="category-card">
              <span>🍱</span>
              <strong>Food & Snacks</strong>
              <small>Local favourites</small>
            </a>

            <a href="/category/services" className="category-card">
              <span>🛠️</span>
              <strong>Local Services</strong>
              <small>People you can trust</small>
            </a>
          </div>
        </section>

        <section className="join-section" id="vendor">
          <div>
            <p className="eyebrow">GROW WITH US</p>
            <h2>Your business deserves to be discovered.</h2>
            <p>
              Bring your local shop online with 0% platform commission.
            </p>
          </div>

          <a href="/register" className="primary-btn">
            Become a Vendor →
          </a>
        </section>

        <section className="delivery-section" id="delivery">
          <div>
            <p className="eyebrow">JOIN OUR LOCAL NETWORK</p>
            <h2>Deliver opportunities to your doorstep.</h2>
            <p>Join 23ENeeDs as a delivery partner.</p>
          </div>

          <a href="/register" className="secondary-btn">
            Join as a Partner →
          </a>
        </section>

        <section className="download-section" id="download">
          <h2>Your local marketplace, on the go.</h2>
          <p>Our app download link will be available here soon.</p>
          <span className="coming-soon">APP COMING SOON</span>
        </section>
      </main>

      <footer>
        <a href="#home" className="footer-logo">23ENeeDs.</a>
        <p>everything you need</p>
        <p>Connecting local communities across Andhra Pradesh.</p>
        <small>
          © {new Date().getFullYear()} 23ENeeDs. All rights reserved.
        </small>
      </footer>
    </div>
  )
}

export default App
