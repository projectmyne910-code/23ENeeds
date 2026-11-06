import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Orders.css'

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      // Load customer's orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          address_id,
          total_amount,
          payment_method,
          payment_status,
          order_status,
          created_at
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (orderError) throw orderError

      if (!orderData || orderData.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // Load items for these orders
      const orderIds = orderData.map(order => order.id)

      const { data: itemData, error: itemError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price
        `)
        .in('order_id', orderIds)

      if (itemError) throw itemError

      const itemsByOrder = {}

      ;(itemData || []).forEach(item => {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = []
        }

        itemsByOrder[item.order_id].push(item)
      })

      const formattedOrders = orderData.map(order => ({
        ...order,
        items: itemsByOrder[order.id] || [],
      }))

      setOrders(formattedOrders)
    } catch (error) {
      console.error(error)
      setMessage('Unable to load your orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatStatus(status) {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
  }

  function getStatusClass(status) {
    return `order-status ${status}`
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setMessage('Unable to sign out. Please try again.')
      return
    }

    window.location.replace('/login')
  }

  if (loading) {
    return (
      <main className="orders-page">
        <p className="orders-loading">Loading your orders...</p>
      </main>
    )
  }

  return (
    <main className="orders-page">
      <header className="orders-header">
        <a href="/" className="orders-logo">
          23ENeeDs<span>.</span>
        </a>

        <div className="orders-header-actions">
          <a href="/dashboard" className="orders-dashboard-link">
            Dashboard
          </a>

          <button onClick={handleLogout} className="orders-logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      <section className="orders-content">
        <div className="orders-title-section">
          <p className="orders-eyebrow">23ENeeDs</p>
          <h1>My Orders</h1>
          <p>
            View your purchases and track your order status.
          </p>
        </div>

        {message && (
          <p className="orders-message" role="alert">
            {message}
          </p>
        )}

        {orders.length === 0 ? (
          <section className="orders-empty">
            <div className="orders-empty-icon">🛍️</div>

            <h2>No orders yet</h2>

            <p>
              You haven't placed any orders yet. Start shopping
              from our marketplace.
            </p>

            <a href="/" className="orders-shop-btn">
              Start Shopping →
            </a>
          </section>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <span className="order-label">Order ID</span>

                    <strong className="order-id">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </strong>

                    <small>
                      {formatDate(order.created_at)}
                    </small>
                  </div>

                  <span className={getStatusClass(order.order_status)}>
                    {formatStatus(order.order_status)}
                  </span>
                </div>

                <div className="order-items">
                  {order.items.map(item => (
                    <div className="order-item" key={item.id}>
                      <div className="order-item-info">
                        <strong>{item.product_name}</strong>

                        <span>
                          {item.quantity} × ₹
                          {Number(item.unit_price).toFixed(2)}
                        </span>
                      </div>

                      <strong>
                        ₹
                        {(
                          Number(item.unit_price) *
                          item.quantity
                        ).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <div>
                    <span>Payment</span>

                    <strong>
                      {order.payment_method === 'cod'
                        ? 'Cash on Delivery'
                        : order.payment_method.toUpperCase()}
                    </strong>

                    <small>
                      {formatStatus(order.payment_status)}
                    </small>
                  </div>

                  <div className="order-total">
                    <span>Total Amount</span>

                    <strong>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Orders