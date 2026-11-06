import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({
    users: 0,
    vendors: 0,
    pendingVendors: 0,
    products: 0,
    orders: 0,
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, requested_role, approval_status")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (
        profile.role !== "admin" ||
        profile.approval_status !== "approved"
      ) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      await Promise.all([
        loadProfiles(),
        loadProducts(),
        loadOrders(),
      ]);
    } catch (error) {
      console.error("Admin check failed:", error);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Profiles error:", error);
      return;
    }

    setProfiles(data || []);

    setStats((prev) => ({
      ...prev,
      users: data?.length || 0,
      vendors:
        data?.filter((p) => p.role === "vendor").length || 0,
      pendingVendors:
        data?.filter(
          (p) =>
            p.requested_role === "vendor" &&
            p.approval_status === "pending"
        ).length || 0,
    }));
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Products error:", error);
      return;
    }

    setProducts(data || []);

    setStats((prev) => ({
      ...prev,
      products: data?.length || 0,
    }));
  }

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders error:", error);
      return;
    }

    setOrders(data || []);

    setStats((prev) => ({
      ...prev,
      orders: data?.length || 0,
    }));
  }

  async function approveVendor(profileId) {
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "vendor",
        approval_status: "approved",
      })
      .eq("id", profileId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProfiles();
  }

  async function rejectVendor(profileId) {
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "customer",
        approval_status: "rejected",
      })
      .eq("id", profileId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProfiles();
  }

  async function toggleProduct(product) {
    const { error } = await supabase
      .from("products")
      .update({
        is_active: !product.is_active,
      })
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProducts();
  }

  async function deleteProduct(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProducts();
  }

  async function updateOrderStatus(orderId, status) {
    const { error } = await supabase
      .from("orders")
      .update({
        order_status: status,
      })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadOrders();
  }

  function logout() {
    supabase.auth.signOut().then(() => {
      window.location.href = "/login";
    });
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="admin-denied">
        <div className="denied-card">
          <div className="denied-icon">🔒</div>

          <h1>Access Denied</h1>

          <p>
            You don't have permission to access the
            23ENeeDs admin dashboard.
          </p>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* SIDEBAR */}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">23</div>

          <div>
            <h2>23ENeeDs</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>

          <button
            className={activeTab === "vendors" ? "active" : ""}
            onClick={() => setActiveTab("vendors")}
          >
            👥 Vendors
            {stats.pendingVendors > 0 && (
              <span className="notification-badge">
                {stats.pendingVendors}
              </span>
            )}
          </button>

          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            👤 Users
          </button>

          <button
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            🛍️ Products
          </button>

          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            📦 Orders
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            className="back-site"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            ← Back to Website
          </button>

          <button className="logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">23ENeeDs CONTROL CENTER</p>

            <h1>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "vendors" && "Vendor Management"}
              {activeTab === "users" && "User Management"}
              {activeTab === "products" && "Product Management"}
              {activeTab === "orders" && "Order Management"}
            </h1>
          </div>

          <div className="admin-status">
            <span className="status-dot"></span>
            Admin Active
          </div>
        </header>

        {/* OVERVIEW */}

        {activeTab === "overview" && (
          <section className="admin-content">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">👤</span>
                <div>
                  <p>Total Users</p>
                  <h2>{stats.users}</h2>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">🏪</span>
                <div>
                  <p>Vendors</p>
                  <h2>{stats.vendors}</h2>
                </div>
              </div>

              <div className="stat-card warning">
                <span className="stat-icon">⏳</span>
                <div>
                  <p>Pending Vendors</p>
                  <h2>{stats.pendingVendors}</h2>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">🛍️</span>
                <div>
                  <p>Products</p>
                  <h2>{stats.products}</h2>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">📦</span>
                <div>
                  <p>Orders</p>
                  <h2>{stats.orders}</h2>
                </div>
              </div>
            </div>

            <div className="admin-section-card">
              <div className="section-heading">
                <div>
                  <p className="section-label">ACTION REQUIRED</p>
                  <h2>Vendor Approvals</h2>
                </div>

                <button
                  onClick={() => setActiveTab("vendors")}
                  className="view-all-btn"
                >
                  View All
                </button>
              </div>

              {stats.pendingVendors === 0 ? (
                <div className="empty-state">
                  <span>✓</span>
                  <p>No pending vendor applications.</p>
                </div>
              ) : (
                <div className="approval-list">
                  {profiles
                    .filter(
                      (p) =>
                        p.requested_role === "vendor" &&
                        p.approval_status === "pending"
                    )
                    .slice(0, 5)
                    .map((vendor) => (
                      <div
                        className="approval-item"
                        key={vendor.id}
                      >
                        <div>
                          <strong>
                            {vendor.full_name || "Unnamed User"}
                          </strong>

                          <span>
                            Vendor application ·{" "}
                            {new Date(
                              vendor.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="approval-actions">
                          <button
                            className="approve-btn"
                            onClick={() =>
                              approveVendor(vendor.id)
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="reject-btn"
                            onClick={() =>
                              rejectVendor(vendor.id)
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* VENDORS */}

        {activeTab === "vendors" && (
          <section className="admin-content">
            <div className="admin-section-card">
              <div className="section-heading">
                <div>
                  <p className="section-label">PARTNER MANAGEMENT</p>
                  <h2>Vendor Applications</h2>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Requested Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {profiles
                      .filter(
                        (p) =>
                          p.requested_role === "vendor"
                      )
                      .map((vendor) => (
                        <tr key={vendor.id}>
                          <td>
                            <strong>
                              {vendor.full_name || "Unnamed"}
                            </strong>
                          </td>

                          <td>Vendor</td>

                          <td>
                            <span
                              className={`status-pill ${vendor.approval_status}`}
                            >
                              {vendor.approval_status}
                            </span>
                          </td>

                          <td>
                            {new Date(
                              vendor.created_at
                            ).toLocaleDateString()}
                          </td>

                          <td>
                            {vendor.approval_status ===
                              "pending" && (
                              <div className="table-actions">
                                <button
                                  className="approve-btn"
                                  onClick={() =>
                                    approveVendor(vendor.id)
                                  }
                                >
                                  Approve
                                </button>

                                <button
                                  className="reject-btn"
                                  onClick={() =>
                                    rejectVendor(vendor.id)
                                  }
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            {vendor.approval_status ===
                              "approved" && (
                              <span className="approved-text">
                                ✓ Approved
                              </span>
                            )}

                            {vendor.approval_status ===
                              "rejected" && (
                              <button
                                className="approve-btn"
                                onClick={() =>
                                  approveVendor(vendor.id)
                                }
                              >
                                Re-approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* USERS */}

        {activeTab === "users" && (
          <section className="admin-content">
            <div className="admin-section-card">
              <div className="section-heading">
                <div>
                  <p className="section-label">CUSTOMER DATABASE</p>
                  <h2>Registered Users</h2>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Requested Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id}>
                        <td>
                          <strong>
                            {profile.full_name || "Unnamed"}
                          </strong>
                        </td>

                        <td>
                          <span className="role-text">
                            {profile.role}
                          </span>
                        </td>

                        <td>
                          {profile.requested_role}
                        </td>

                        <td>
                          <span
                            className={`status-pill ${profile.approval_status}`}
                          >
                            {profile.approval_status}
                          </span>
                        </td>

                        <td>
                          {new Date(
                            profile.created_at
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* PRODUCTS */}

        {activeTab === "products" && (
          <section className="admin-content">
            <div className="admin-section-card">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    MARKETPLACE CATALOG
                  </p>
                  <h2>All Products</h2>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                              />
                            ) : (
                              <div className="product-placeholder">
                                🛍️
                              </div>
                            )}

                            <strong>{product.name}</strong>
                          </div>
                        </td>

                        <td>{product.category}</td>

                        <td>
                          ₹{Number(product.price).toFixed(2)}
                        </td>

                        <td>{product.stock}</td>

                        <td>
                          <span
                            className={`status-pill ${
                              product.is_active
                                ? "approved"
                                : "rejected"
                            }`}
                          >
                            {product.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              className="small-action"
                              onClick={() =>
                                toggleProduct(product)
                              }
                            >
                              {product.is_active
                                ? "Disable"
                                : "Activate"}
                            </button>

                            <button
                              className="delete-action"
                              onClick={() =>
                                deleteProduct(product.id)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {products.length === 0 && (
                  <div className="empty-state">
                    <span>🛍️</span>
                    <p>No products have been added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ORDERS */}

        {activeTab === "orders" && (
          <section className="admin-content">
            <div className="admin-section-card">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    ORDER OPERATIONS
                  </p>
                  <h2>All Orders</h2>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Payment Status</th>
                      <th>Order Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>
                            #{order.id.slice(0, 8)}
                          </strong>
                        </td>

                        <td>
                          ₹
                          {Number(
                            order.total_amount
                          ).toFixed(2)}
                        </td>

                        <td>
                          {order.payment_method?.toUpperCase()}
                        </td>

                        <td>
                          <span
                            className={`status-pill ${order.payment_status}`}
                          >
                            {order.payment_status}
                          </span>
                        </td>

                        <td>
                          <select
                            className="order-status-select"
                            value={order.order_status}
                            onChange={(e) =>
                              updateOrderStatus(
                                order.id,
                                e.target.value
                              )
                            }
                          >
                            <option value="placed">
                              Placed
                            </option>
                            <option value="confirmed">
                              Confirmed
                            </option>
                            <option value="preparing">
                              Preparing
                            </option>
                            <option value="shipped">
                              Shipped
                            </option>
                            <option value="delivered">
                              Delivered
                            </option>
                            <option value="cancelled">
                              Cancelled
                            </option>
                          </select>
                        </td>

                        <td>
                          {new Date(
                            order.created_at
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {orders.length === 0 && (
                  <div className="empty-state">
                    <span>📦</span>
                    <p>No orders yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}