import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Checkout.css'

const SUPPORTED_CITIES = [
  'madanapalle',
  'palamaner',
  'chittoor',
  'punganur',
]

function Checkout() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [message, setMessage] = useState('')
  const [orderId, setOrderId] = useState('')
  const [total, setTotal] = useState(0)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address_line: '',
    landmark: '',
    city: '',
    state: 'Andhra Pradesh',
    pincode: '',
  })

  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    async function loadCheckout() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        window.location.replace('/login')
        return
      }

      setUser(authData.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (profile?.full_name) {
        setForm(current => ({
          ...current,
          full_name: profile.full_name,
        }))
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          products (
            id,
            name,
            price,
            stock,
            is_active
          )
        `)
        .eq('customer_id', authData.user.id)

      if (error) {
        console.error(error)
        setMessage('Unable to load your cart.')
      } else {
        const validItems = (data || []).filter(
          item => item.products?.is_active
        )

        setCartItems(validItems)

        const cartTotal = validItems.reduce(
          (sum, item) =>
            sum + Number(item.products.price) * item.quantity,
          0
        )

        setTotal(cartTotal)
      }

      setLoading(false)
    }

    loadCheckout()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setForm(current => ({
      ...current,
      [name]: value,
    }))
  }

  async function handlePlaceOrder(event) {
    event.preventDefault()
    setMessage('')

    if (!user || cartItems.length === 0) {
      setMessage('Your cart is empty.')
      return
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setMessage('Enter a valid 10-digit Indian mobile number.')
      return
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      setMessage('Enter a valid 6-digit PIN code.')
      return
    }

    // Phase 1 service-area restriction
    const normalizedCity = form.city.trim().toLowerCase()

    if (!SUPPORTED_CITIES.includes(normalizedCity)) {
      setMessage(
        '23ENeeDs is currently available only in Madanapalle, Palamaner, Chittoor and Punganur.'
      )
      return
    }

    setPlacingOrder(true)

    // Save the customer's delivery address
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .insert({
        customer_id: user.id,
        full_name: form.full_name.trim(),
        phone: form.phone,
        address_line: form.address_line.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode,
      })
      .select('id')
      .single()

    if (addressError) {
      console.error(addressError)
      setMessage('Unable to save your address. Please try again.')
      setPlacingOrder(false)
      return
    }

    // Place a secure Cash on Delivery order
    const { data: newOrderId, error: orderError } =
      await supabase.rpc('place_customer_order', {
        p_address_id: address.id,
      })

    if (orderError) {
      console.error(orderError)
      setMessage(orderError.message || 'Unable to place your order.')
      setPlacingOrder(false)
      return
    }

    setOrderId(newOrderId)
    setPlacingOrder(false)
  }

  if (loading) {
    return (
      <main className="checkout-page">
        <p>Loading checkout...</p>
      </main>
    )
  }

  if (orderId) {
    return (
      <main className="checkout-page">
        <section className="order-success">
          <div className="success-icon">✓</div>

          <p className="checkout-eyebrow">
            23ENeeDs ORDER CONFIRMATION
          </p>

          <h1>Order placed successfully!</h1>

          <p>
            Thank you for shopping with 23ENeeDs.
          </p>

          <div className="success-details">
            <p><strong>Order ID</strong></p>

            <p className="order-id">
              {orderId}
            </p>

            <p><strong>Order Total</strong></p>

            <h2>
              ₹{total.toFixed(2)}
            </h2>

            <p>
              <strong>Payment Method:</strong> Cash on Delivery
            </p>

            <p>
              <strong>Payment Status:</strong> Pending
            </p>

            <p>
              <strong>Order Status:</strong> Placed
            </p>
          </div>

          <a
            href="/"
            className="checkout-primary-btn"
          >
            Continue Shopping
          </a>
        </section>
      </main>
    )
  }

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <h1>Your cart is empty</h1>

          <p>
            Add some products before proceeding to checkout.
          </p>

          <a
            href="/"
            className="checkout-primary-btn"
          >
            Explore Products
          </a>
        </section>
      </main>
    )
  }

  return (
    <main className="checkout-page">

      <header className="checkout-header">
        <a
          href="/"
          className="checkout-logo"
        >
          23ENeeDs<span>.</span>
        </a>

        <a href="/cart">
          ← Back to Cart
        </a>
      </header>

      <section className="checkout-content">

        <p className="checkout-eyebrow">
          ALMOST THERE!
        </p>

        <h1>Checkout</h1>

        <p>
          Enter your delivery details to place your order.
        </p>

        {message && (
          <p
            className="checkout-message"
            role="alert"
          >
            {message}
          </p>
        )}

        <div className="checkout-layout">

          <form
            className="address-form"
            onSubmit={handlePlaceOrder}
          >

            <h2>Delivery Address</h2>

            <label>
              Full Name *

              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </label>

            <label>
              Mobile Number *

              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
                placeholder="10-digit mobile number"
                required
              />
            </label>

            <label>
              House Number / Street Address *

              <textarea
                name="address_line"
                value={form.address_line}
                onChange={handleChange}
                rows="3"
                maxLength={300}
                required
              />
            </label>

            <label>
              Landmark

              <input
                name="landmark"
                value={form.landmark}
                onChange={handleChange}
                maxLength={150}
                placeholder="Nearby landmark (optional)"
              />
            </label>

            <div className="checkout-form-row">

              <label>
                City *

                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Madanapalle, Palamaner, Chittoor or Punganur"
                  required
                />

                <small>
                  Currently serving Madanapalle, Palamaner,
                  Chittoor and Punganur.
                </small>
              </label>

              <label>
                PIN Code *

                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 digits"
                  required
                />
              </label>

            </div>

            <label>
              State *

              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </label>

            <h2>Payment Method</h2>

            <div className="payment-option">
              <span>💵</span>

              <div>
                <strong>Cash on Delivery</strong>

                <p>
                  Pay when your order is delivered.
                </p>
              </div>

              <input
                type="radio"
                checked
                readOnly
              />
            </div>

            <div className="payment-option payment-disabled">

              <span>📱</span>

              <div>
                <strong>UPI</strong>

                <p>
                  Online payment will be available soon.
                </p>
              </div>

              <span>Coming soon</span>

            </div>

            <button
              type="submit"
              className="checkout-primary-btn"
              disabled={placingOrder}
            >
              {placingOrder
                ? 'Placing Order...'
                : 'Place Order'}
            </button>

          </form>

          <aside className="checkout-summary">

            <h2>Order Summary</h2>

            {cartItems.map(item => (
              <div
                className="checkout-summary-item"
                key={item.id}
              >

                <span>
                  {item.products.name} × {item.quantity}
                </span>

                <strong>
                  ₹{(
                    Number(item.products.price) *
                    item.quantity
                  ).toFixed(2)}
                </strong>

              </div>
            ))}

            <hr />

            <div className="checkout-total">

              <span>Subtotal</span>

              <strong>
                ₹{total.toFixed(2)}
              </strong>

            </div>

            <p>
              Delivery charges will be confirmed separately.
            </p>

          </aside>

        </div>

      </section>

    </main>
  )
}

export default Checkout