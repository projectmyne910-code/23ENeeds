import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

const categories = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'food', label: 'Food & Snacks' },
  { value: 'services', label: 'Local Services' },
]

function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)

  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'groceries',
    price: '',
    stock: '',
  })

  const [image, setImage] = useState(null)

  // Edit product state
  const [editingProduct, setEditingProduct] = useState(null)

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: 'groceries',
    price: '',
    stock: '',
  })

  const [editImage, setEditImage] = useState(null)
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        window.location.replace('/login')
        return
      }

      setUser(authData.user)

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, requested_role, approval_status')
        .eq('id', authData.user.id)
        .single()

      if (error) {
        setMessage('Unable to load your profile. Please try again.')
      } else {
        setProfile(data)
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  async function loadProducts() {
    if (!user) return

    setProductsLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setMessage('Unable to load your products.')
    } else {
      setProducts(data || [])
    }

    setProductsLoading(false)
  }

  useEffect(() => {
    if (
      profile?.role === 'vendor' &&
      profile?.approval_status === 'approved'
    ) {
      loadProducts()
    }
  }, [profile, user])

  async function handleAddProduct(event) {
    event.preventDefault()
    setMessage('')

    if (!form.name.trim() || !form.price || form.stock === '') {
      setMessage('Please fill in the product name, price and stock.')
      return
    }

    if (
      Number(form.price) < 0 ||
      Number(form.stock) < 0 ||
      !Number.isInteger(Number(form.stock))
    ) {
      setMessage('Enter a valid price and whole-number stock quantity.')
      return
    }

    if (
      image &&
      !['image/jpeg', 'image/png', 'image/webp'].includes(image.type)
    ) {
      setMessage('Please choose a JPG, PNG or WebP image.')
      return
    }

    if (image && image.size > 5 * 1024 * 1024) {
      setMessage('Image size must be 5 MB or less.')
      return
    }

    setSaving(true)

    let imageUrl = null

    if (image) {
      const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const imagePath = `${user.id}/${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('Product-images')
        .upload(imagePath, image, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        setMessage(`Image upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('Product-images')
        .getPublicUrl(imagePath)

      imageUrl = urlData.publicUrl
    }

    const { error } = await supabase
      .from('products')
      .insert({
        vendor_id: user.id,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        image_url: imageUrl,
        is_active: true,
      })

    if (error) {
      console.error(error)
      setMessage('Unable to save product. Please try again.')
    } else {
      setMessage('Product added successfully!')

      setForm({
        name: '',
        description: '',
        category: 'groceries',
        price: '',
        stock: '',
      })

      setImage(null)

      const fileInput = document.getElementById('product-image')

      if (fileInput) {
        fileInput.value = ''
      }

      await loadProducts()
    }

    setSaving(false)
  }

  function startEditing(product) {
    setEditingProduct(product)

    setEditForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'groceries',
      price: product.price ?? '',
      stock: product.stock ?? '',
    })

    setEditImage(null)
    setMessage('')
  }

  function cancelEditing() {
    setEditingProduct(null)
    setEditImage(null)
  }

  async function handleEditProduct(event) {
    event.preventDefault()
    setMessage('')

    if (!editingProduct) return

    if (
      !editForm.name.trim() ||
      editForm.price === '' ||
      editForm.stock === ''
    ) {
      setMessage('Please fill in the product name, price and stock.')
      return
    }

    if (
      Number(editForm.price) < 0 ||
      Number(editForm.stock) < 0 ||
      !Number.isInteger(Number(editForm.stock))
    ) {
      setMessage('Enter a valid price and whole-number stock quantity.')
      return
    }

    if (
      editImage &&
      !['image/jpeg', 'image/png', 'image/webp'].includes(editImage.type)
    ) {
      setMessage('Please choose a JPG, PNG or WebP image.')
      return
    }

    if (editImage && editImage.size > 5 * 1024 * 1024) {
      setMessage('Image size must be 5 MB or less.')
      return
    }

    setEditSaving(true)

    let imageUrl = editingProduct.image_url

    // Upload new image only if vendor selected one
    if (editImage) {
      const safeName = editImage.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const imagePath = `${user.id}/${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('Product-images')
        .upload(imagePath, editImage, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        setMessage(`Image upload failed: ${uploadError.message}`)
        setEditSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('Product-images')
        .getPublicUrl(imagePath)

      imageUrl = urlData.publicUrl
    }

    const { error } = await supabase
      .from('products')
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        image_url: imageUrl,
      })
      .eq('id', editingProduct.id)
      .eq('vendor_id', user.id)

    if (error) {
      console.error(error)
      setMessage('Unable to update product.')
    } else {
      setMessage('Product updated successfully!')
      setEditingProduct(null)
      setEditImage(null)
      await loadProducts()
    }

    setEditSaving(false)
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setMessage('')

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('vendor_id', user.id)

    if (error) {
      console.error(error)

      setMessage(
        'Unable to delete this product. If it has already been used in an order, deactivate it instead.'
      )

      return
    }

    setProducts(current =>
      current.filter(item => item.id !== product.id)
    )

    setMessage('Product deleted successfully.')
  }

  async function toggleProduct(product) {
    setMessage('')

    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
      .eq('vendor_id', user.id)

    if (error) {
      console.error(error)
      setMessage('Unable to update product status.')
    } else {
      setProducts(current =>
        current.map(item =>
          item.id === product.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      )

      setMessage(
        product.is_active
          ? 'Product deactivated.'
          : 'Product activated.'
      )
    }
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
      <main className="dashboard">
        <p>Loading your dashboard...</p>
      </main>
    )
  }

  if (message && !profile) {
    return (
      <main className="dashboard">
        <p>{message}</p>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="dashboard">
        <p>Profile not found.</p>
      </main>
    )
  }

  const requestedRole = profile.requested_role
  const isApproved = profile.approval_status === 'approved'
  const isVendor =
    profile.role === 'vendor' && requestedRole === 'vendor'

  if (isVendor && isApproved) {
    return (
      <main className="dashboard vendor-dashboard">
        <header className="dashboard-header">
          <a href="/" className="dashboard-logo">
            23ENeeDs<span>.</span>
          </a>

          <button onClick={handleLogout} className="logout-btn">
            Sign Out
          </button>
        </header>

        <section className="dashboard-content vendor-content">
          <p className="dashboard-eyebrow">
            23ENeeDs SELLER CENTRE
          </p>

          <h1>
            Welcome, {profile.full_name || 'Vendor'}!
          </h1>

          <h2>Vendor Dashboard</h2>

          <p>
            Manage your shop and grow your local business.
          </p>

          {message && (
            <p className="vendor-message" role="status">
              {message}
            </p>
          )}

          <div className="vendor-stats">
            <div className="vendor-stat-card">
              <span>Total Products</span>
              <strong>{products.length}</strong>
            </div>

            <div className="vendor-stat-card">
              <span>Active Products</span>
              <strong>
                {products.filter(p => p.is_active).length}
              </strong>
            </div>

            <div className="vendor-stat-card">
              <span>Orders</span>
              <strong>0</strong>
            </div>
          </div>

          {/* ADD PRODUCT */}
          <section className="vendor-section">
            <h2>Add a New Product</h2>

            <form
              className="vendor-product-form"
              onSubmit={handleAddProduct}
            >
              <label>
                Product Name *
                <input
                  type="text"
                  value={form.name}
                  onChange={e =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Example: Fresh Tomatoes"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={e =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your product"
                  rows="3"
                />
              </label>

              <label>
                Category *
                <select
                  value={form.category}
                  onChange={e =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                >
                  {categories.map(category => (
                    <option
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="vendor-form-row">
                <label>
                  Price (₹) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e =>
                      setForm({
                        ...form,
                        price: e.target.value,
                      })
                    }
                    placeholder="100"
                    required
                  />
                </label>

                <label>
                  Available Stock *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={e =>
                      setForm({
                        ...form,
                        stock: e.target.value,
                      })
                    }
                    placeholder="20"
                    required
                  />
                </label>
              </div>

              <label>
                Product Image (optional, max 5 MB)
                <input
                  id="product-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e =>
                    setImage(e.target.files?.[0] || null)
                  }
                />
              </label>

              {image && (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Product preview"
                  className="vendor-image-preview"
                />
              )}

              <button type="submit" disabled={saving}>
                {saving ? 'Saving Product...' : 'Add Product'}
              </button>
            </form>
          </section>

          {/* MY PRODUCTS */}
          <section className="vendor-section">
            <h2>My Products</h2>

            {productsLoading && (
              <p>Loading products...</p>
            )}

            {!productsLoading && products.length === 0 && (
              <p>You haven't added any products yet.</p>
            )}

            <div className="vendor-product-list">
              {products.map(product => (
                <article
                  className="vendor-product-item"
                  key={product.id}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <div className="vendor-product-placeholder">
                      🛍️
                    </div>
                  )}

                  <div className="vendor-product-details">
                    <h3>{product.name}</h3>

                    <p>
                      {
                        categories.find(
                          c => c.value === product.category
                        )?.label
                      }
                    </p>

                    <strong>
                      ₹{Number(product.price).toFixed(2)}
                    </strong>

                    <small>
                      Stock: {product.stock}
                    </small>

                    <small>
                      {product.is_active
                        ? 'Active'
                        : 'Inactive'}
                    </small>
                  </div>

                  <div className="vendor-product-actions">
                    <button
                      type="button"
                      className="vendor-toggle-btn"
                      onClick={() =>
                        toggleProduct(product)
                      }
                    >
                      {product.is_active
                        ? 'Deactivate'
                        : 'Activate'}
                    </button>

                    <button
                      type="button"
                      className="vendor-edit-btn"
                      onClick={() =>
                        startEditing(product)
                      }
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      className="vendor-delete-btn"
                      onClick={() =>
                        handleDeleteProduct(product)
                      }
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* EDIT PRODUCT */}
          {editingProduct && (
            <section className="vendor-section">
              <h2>
                Edit Product: {editingProduct.name}
              </h2>

              <form
                className="vendor-product-form"
                onSubmit={handleEditProduct}
              >
                <label>
                  Product Name *
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        name: e.target.value,
                      })
                    }
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={editForm.description}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </label>

                <label>
                  Category *
                  <select
                    value={editForm.category}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value,
                      })
                    }
                  >
                    {categories.map(category => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="vendor-form-row">
                  <label>
                    Price (₹) *
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={e =>
                        setEditForm({
                          ...editForm,
                          price: e.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Available Stock *
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.stock}
                      onChange={e =>
                        setEditForm({
                          ...editForm,
                          stock: e.target.value,
                        })
                      }
                      required
                    />
                  </label>
                </div>

                <label>
                  Replace Product Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e =>
                      setEditImage(
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </label>

                <div className="vendor-edit-actions">
                  <button
                    type="submit"
                    disabled={editSaving}
                  >
                    {editSaving
                      ? 'Updating...'
                      : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}
        </section>
      </main>
    )
  }

  let title = 'Customer Dashboard'
  let description =
    'Discover local products and manage your orders.'

  if (requestedRole === 'vendor') {
    title = 'Vendor Application Pending'
    description =
      'Your vendor application is awaiting approval.'
  } else if (
    requestedRole === 'delivery_partner'
  ) {
    title = isApproved
      ? 'Delivery Partner Dashboard'
      : 'Delivery Application Pending'

    description = isApproved
      ? 'Your delivery partner dashboard.'
      : 'Your delivery partner application is awaiting approval.'
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <a href="/" className="dashboard-logo">
          23ENeeDs<span>.</span>
        </a>

        <button
          onClick={handleLogout}
          className="logout-btn"
        >
          Sign Out
        </button>
      </header>

      <section className="dashboard-content">
        <p className="dashboard-eyebrow">
          EVERYTHING YOU NEED
        </p>

        <h1>
          Welcome, {profile.full_name || 'there'}!
        </h1>

        <h2>{title}</h2>

        <p>{description}</p>

        {requestedRole !== 'customer' &&
          !isApproved && (
            <div className="dashboard-notice">
              <strong>
                Application status: Pending
              </strong>

              <p>
                Vendor or delivery management remains
                unavailable until approval.
              </p>
            </div>
          )}

        {requestedRole === 'customer' && (
          <div className="dashboard-card">
            <h3>Your marketplace 🛍️</h3>

            <p>
              Discover products, shop locally and
              manage your orders.
            </p>

            <a href="/">
              Explore Products →
            </a>

              <br />
              <br />

              <a href="/cart">
                🛒 View My Cart
              </a>

              <br />
              <br />

              <a href="/orders">
                📦 My Orders
              </a>
          </div>
        )}
      </section>
    </main>
  )
}

export default Dashboard