
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Category.css'

const categoryDetails = {
  groceries: {
    title: 'Groceries',
    emoji: '🥬',
    description: 'Fresh essentials for your everyday needs.',
  },
  fashion: {
    title: 'Fashion',
    emoji: '👕',
    description: 'Discover styles from local shops.',
  },
  food: {
    title: 'Food & Snacks',
    emoji: '🍱',
    description: 'Explore local food and delicious favourites.',
  },
  services: {
    title: 'Local Services',
    emoji: '🛠️',
    description: 'Find trusted services in your neighbourhood.',
  },
}

function Category() {
  const slug = window.location.pathname.split('/').filter(Boolean).pop()
  const category = categoryDetails[slug]

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [addingProduct, setAddingProduct] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      if (!category) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', slug)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        setError('Unable to load products. Please try again.')
        console.error(error)
      } else {
        setProducts(data || [])
      }

      setLoading(false)
    }

    fetchProducts()
  }, [slug, category])

  async function addToCart(product) {
    setCartMessage('')
    setAddingProduct(product.id)

    const { data: authData, error: authError } =
      await supabase.auth.getUser()

    if (authError || !authData.user) {
      setCartMessage('Please sign in to add products to your cart.')
      setAddingProduct(null)
      return
    }

    if (product.stock < 1) {
      setCartMessage('This product is currently out of stock.')
      setAddingProduct(null)
      return
    }

    const { data: existingItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('customer_id', authData.user.id)
      .eq('product_id', product.id)
      .maybeSingle()

    if (fetchError) {
      console.error(fetchError)
      setCartMessage('Unable to check your cart. Please try again.')
      setAddingProduct(null)
      return
    }

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setCartMessage('You have added all available stock to your cart.')
        setAddingProduct(null)
        return
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id)
        .eq('customer_id', authData.user.id)

      if (updateError) {
        console.error(updateError)
        setCartMessage('Unable to update your cart. Please try again.')
      } else {
        setCartMessage(`${product.name} quantity updated in your cart!`)
      }
    } else {
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          customer_id: authData.user.id,
          product_id: product.id,
          quantity: 1,
        })

      if (insertError) {
        console.error(insertError)
        setCartMessage('Unable to add this product. Please try again.')
      } else {
        setCartMessage(`${product.name} added to your cart!`)
      }
    }

    setAddingProduct(null)
  }

  if (!category) {
    return (
      <main className="category-page">
        <h1>Category not found</h1>
        <a href="/">Back to Home</a>
      </main>
    )
  }

  return (
    <main className="category-page">
      <a href="/" className="category-back">← Back to Home</a>

      <section className="category-heading">
        <span className="category-emoji">{category.emoji}</span>
        <p className="category-eyebrow">EXPLORE 23ENeeDs</p>
        <h1>{category.title}</h1>
        <p>{category.description}</p>
      </section>

      <section className="category-products">
        <h2>Available products</h2>

        {loading && <p>Loading products...</p>}
        {error && <p>{error}</p>}
        {cartMessage && <p role="status">{cartMessage}</p>}

        {!loading && !error && products.length === 0 && (
          <div className="category-empty">
            <span>🛍️</span>
            <h3>No products available yet</h3>
            <p>
              Our local vendors will be adding products soon.
              Please check back later!
            </p>
          </div>
        )}

        <div className="products-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="product-image"
                />
              ) : (
                <div className="product-image-placeholder">
                  🛍️
                </div>
              )}

              <div className="product-info">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <strong>₹{Number(product.price).toFixed(2)}</strong>
                <small>
                  {product.stock > 0
                    ? `${product.stock} available`
                    : 'Out of stock'}
                </small>

                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={product.stock < 1 || addingProduct === product.id}
                >
                  {addingProduct === product.id
                    ? 'Adding...'
                    : product.stock < 1
                      ? 'Out of Stock'
                      : 'Add to Cart'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Category
