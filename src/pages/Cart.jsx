
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Cart.css'

function Cart() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function loadCart() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        window.location.replace('/login')
        return
      }

      setUser(authData.user)

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            description,
            price,
            image_url,
            stock,
            is_active
          )
        `)
        .eq('customer_id', authData.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setMessage('Unable to load your cart.')
      } else {
        setItems(data || [])
      }

      setLoading(false)
    }

    loadCart()
  }, [])

  async function updateQuantity(item, newQuantity) {
    if (newQuantity < 1) return

    const product = item.products

    if (!product || !product.is_active) {
      setMessage('This product is no longer available.')
      return
    }

    if (newQuantity > product.stock) {
      setMessage(`Only ${product.stock} units are available.`)
      return
    }

    setMessage('')

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', item.id)
      .eq('customer_id', user.id)

    if (error) {
      console.error(error)
      setMessage('Unable to update quantity.')
      return
    }

    setItems(current =>
      current.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    )
  }

  async function removeItem(itemId) {
    setMessage('')

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('customer_id', user.id)

    if (error) {
      console.error(error)
      setMessage('Unable to remove this product.')
      return
    }

    setItems(current => current.filter(item => item.id !== itemId))
    setMessage('Product removed from your cart.')
  }

  if (loading) {
    return <main className="cart-page"><p>Loading your cart...</p></main>
  }

  const validItems = items.filter(
    item => item.products && item.products.is_active
  )

  const subtotal = validItems.reduce(
    (total, item) =>
      total + Number(item.products.price) * item.quantity,
    0
  )

  return (
    <main className="cart-page">
      <header className="cart-header">
        <a href="/" className="cart-logo">
          23ENeeDs<span>.</span>
        </a>
        <a href="/" className="cart-back">Continue Shopping</a>
      </header>

      <section className="cart-content">
        <p className="cart-eyebrow">YOUR SHOPPING BAG</p>
        <h1>My Cart 🛒</h1>
        <p>Review your selected products before checkout.</p>

        {message && (
          <p className="cart-message" role="status">{message}</p>
        )}

        {items.length === 0 ? (
          <div className="cart-empty">
            <span>🛍️</span>
            <h2>Your cart is empty</h2>
            <p>Explore our marketplace and discover something you love.</p>
            <a href="/">Start Shopping</a>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {items.map(item => {
                const product = item.products

                if (!product || !product.is_active) {
                  return (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-item-info">
                        <h3>Product unavailable</h3>
                        <p>This product is no longer available.</p>
                        <button onClick={() => removeItem(item.id)}>
                          Remove
                        </button>
                      </div>
                    </article>
                  )
                }

                return (
                  <article className="cart-item" key={item.id}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="cart-product-image"
                      />
                    ) : (
                      <div className="cart-product-placeholder">🛍️</div>
                    )}

                    <div className="cart-item-info">
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <strong>
                        ₹{Number(product.price).toFixed(2)}
                      </strong>

                      <div className="cart-quantity">
                        <button
                          onClick={() =>
                            updateQuantity(item, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            updateQuantity(item, item.quantity + 1)
                          }
                          disabled={item.quantity >= product.stock}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="cart-remove"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>

                    <strong className="cart-item-total">
                      ₹{(Number(product.price) * item.quantity).toFixed(2)}
                    </strong>
                  </article>
                )
              })}
            </section>

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              <div className="cart-summary-row">
                <span>Products</span>
                <span>{validItems.length}</span>
              </div>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>₹{subtotal.toFixed(2)}</strong>
              </div>

              <div className="cart-summary-row">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>

              <hr />

              <div className="cart-summary-total">
                <span>Total</span>
                <strong>₹{subtotal.toFixed(2)}</strong>
              </div>

              <button
                className="checkout-btn"
                disabled={validItems.length === 0}
                onClick={() => window.location.href = '/checkout'}
              >
                Proceed to Checkout
              </button>

              <p>Delivery charges may apply.</p>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

export default Cart
