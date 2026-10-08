
/* =========================================================
   IsokoHub Admin Dashboard
   public/admin.js
   ========================================================= */

"use strict";

/* =========================================================
   API CONFIG
   ========================================================= */

const API_BASE = window.location.origin;

let currentAdmin = null;
let adminProducts = [];
let adminUsers = [];
let adminOrders = [];
let adminServices = [];
let adminCategories = [];
let adminReports = null;


/* =========================================================
   API HELPER
   ========================================================= */

async function apiFetch(path, options = {}) {

  const config = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  };

  const response = await fetch(
    API_BASE + path,
    config
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {

    throw new Error(
      data.error ||
      data.message ||
      `Request failed: ${response.status}`
    );

  }

  return data;
}


/* =========================================================
   ELEMENT HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatMoney(value) {

  const number = Number(value || 0);

  return new Intl.NumberFormat("en-US").format(number);
}


function showMessage(message, type = "error") {

  let box = $("adminToast");

  if (!box) {

    box = document.createElement("div");

    box.id = "adminToast";

    box.style.position = "fixed";
    box.style.right = "20px";
    box.style.bottom = "20px";
    box.style.zIndex = "99999";
    box.style.padding = "14px 18px";
    box.style.borderRadius = "10px";
    box.style.color = "#fff";
    box.style.fontSize = "14px";
    box.style.maxWidth = "350px";
    box.style.boxShadow = "0 10px 30px rgba(0,0,0,.25)";

    document.body.appendChild(box);
  }

  box.style.background =
    type === "success"
      ? "#16a34a"
      : type === "warning"
      ? "#d97706"
      : "#dc2626";

  box.textContent = message;

  clearTimeout(window.__adminToastTimer);

  window.__adminToastTimer =
    setTimeout(() => {
      box.remove();
    }, 3500);
}


/* =========================================================
   LOGIN
   ========================================================= */

async function adminLogin() {

  const username =
    $("adminUsername")?.value.trim();

  const password =
    $("adminPassword")?.value || "";

  const message =
    $("loginMessage");


  if (!username || !password) {

    if (message) {
      message.textContent =
        "Please enter your username and password.";
    }

    return;
  }


  if (message) {
    message.textContent = "Logging in...";
  }


  try {

    /*
      Your Worker supports:
      POST /api/login
    */

    const data = await apiFetch(
      "/api/login",
      {
        method: "POST",
        body: JSON.stringify({
          username,
          email: username,
          password
        })
      }
    );


    /*
      The Worker may return the user/session
      using different property names.
    */

    currentAdmin =
      data.user ||
      data.account ||
      data;


    /*
      Verify the logged-in account with
      the protected /api/me endpoint.
    */

    const me = await apiFetch("/api/me");

    currentAdmin =
      me.user ||
      me;


    if (
      !currentAdmin ||
      String(currentAdmin.role || "").toLowerCase() !== "admin"
    ) {

      /*
        Logout immediately if the account
        is not actually an administrator.
      */

      try {
        await apiFetch(
          "/api/logout",
          { method: "POST" }
        );
      } catch {}

      throw new Error(
        "This account does not have administrator access."
      );
    }


    showAdminDashboard();

    await loadAdminDashboard();

  } catch (error) {

    console.error("Admin login error:", error);

    if (message) {
      message.textContent =
        "❌ " + error.message;
    }

  }
}


/* =========================================================
   SESSION CHECK
   ========================================================= */

async function checkAdminSession() {

  try {

    const data =
      await apiFetch("/api/me");

    const user =
      data.user ||
      data;


    if (
      user &&
      String(user.role || "").toLowerCase() === "admin"
    ) {

      currentAdmin = user;

      showAdminDashboard();

      await loadAdminDashboard();

      return true;
    }


    showLoginGate();

    return false;

  } catch (error) {

    console.log(
      "No active admin session."
    );

    showLoginGate();

    return false;
  }
}


/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showAdminDashboard() {

  if ($("loginGate")) {
    $("loginGate").style.display = "none";
  }

  if ($("adminApp")) {
    $("adminApp").style.display = "block";
  }

}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLoginGate() {

  if ($("loginGate")) {
    $("loginGate").style.display = "flex";
  }

  if ($("adminApp")) {
    $("adminApp").style.display = "none";
  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function adminLogout() {

  try {

    await apiFetch(
      "/api/logout",
      {
        method: "POST"
      }
    );

  } catch (error) {

    console.warn(
      "Logout request failed:",
      error
    );

  }

  currentAdmin = null;

  showLoginGate();

  if ($("adminUsername")) {
    $("adminUsername").value = "";
  }

  if ($("adminPassword")) {
    $("adminPassword").value = "";
  }

}


/* =========================================================
   SECTION NAVIGATION
   ========================================================= */

function showSection(sectionId, button) {

  document
    .querySelectorAll(".section")
    .forEach(section => {
      section.classList.remove("active");
    });


  const section =
    document.getElementById(sectionId);

  if (section) {
    section.classList.add("active");
  }


  document
    .querySelectorAll("aside button")
    .forEach(btn => {
      btn.classList.remove("active");
    });


  if (button) {
    button.classList.add("active");
  }


  /*
    Load data when the administrator
    opens a section.
  */

  if (sectionId === "dashboard") {
    loadAdminDashboard();
  }

  if (sectionId === "products") {
    loadAdminProducts();
  }

  if (sectionId === "users") {
    loadAdminUsers();
  }

  if (sectionId === "reports") {
    loadAdminReports();
  }

  if (sectionId === "messages") {
    loadAdminMessages();
  }

  if (sectionId === "settings") {
    loadAdminSettings();
  }

}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

async function loadAdminDashboard() {

  try {

    const data =
      await apiFetch("/api/admin/stats");


    /*
      Support common response structures.
    */

    const stats =
      data.stats ||
      data.data ||
      data;


    const users =
      stats.users ??
      stats.total_users ??
      stats.totalUsers ??
      0;

    const products =
      stats.products ??
      stats.total_products ??
      stats.totalProducts ??
      0;

    const pending =
      stats.pending_products ??
      stats.pendingProducts ??
      0;

    const reports =
      stats.reports ??
      stats.total_reports ??
      stats.totalReports ??
      0;


    if ($("usersCount")) {
      $("usersCount").textContent =
        formatMoney(users);
    }

    if ($("productsCount")) {
      $("productsCount").textContent =
        formatMoney(products);
    }

    if ($("pendingCount")) {
      $("pendingCount").textContent =
        formatMoney(pending);
    }

    if ($("reportsCount")) {
      $("reportsCount").textContent =
        formatMoney(reports);
    }


    await loadRecentActivity();

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    showMessage(
      "Could not load dashboard statistics."
    );
  }

}


/* =========================================================
   RECENT ACTIVITY
   ========================================================= */

async function loadRecentActivity() {

  const section =
    $("dashboard");

  if (!section) return;


  const table =
    section.querySelector("table tbody");

  if (!table) return;


  try {

    const data =
      await apiFetch("/api/admin/users");

    const users =
      data.users ||
      data.data ||
      [];


    if (!Array.isArray(users) || users.length === 0) {
      return;
    }


    const recent =
      users.slice(0, 5);


    table.innerHTML =
      recent.map(user => {

        const name =
          user.name ||
          user.username ||
          user.email ||
          "User";


        const date =
          user.created_at ||
          user.createdAt ||
          "—";


        return `
          <tr>
            <td>${escapeHTML(name)}</td>
            <td>Account activity</td>
            <td>${escapeHTML(date)}</td>
          </tr>
        `;

      }).join("");


  } catch (error) {

    console.warn(
      "Recent activity unavailable:",
      error
    );

  }

}


/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadAdminProducts() {

  try {

    const data =
      await apiFetch("/api/admin/products");


    adminProducts =
      data.products ||
      data.data ||
      [];


    renderAdminProducts();

  } catch (error) {

    console.error(
      "Products error:",
      error
    );

    showMessage(
      "Could not load products."
    );
  }

}


function renderAdminProducts() {

  const section =
    $("products");

  if (!section) return;


  let table =
    section.querySelector("table");


  if (!table) return;


  let tbody =
    table.querySelector("tbody");


  if (!tbody) {

    tbody =
      document.createElement("tbody");

    table.appendChild(tbody);
  }


  if (
    !Array.isArray(adminProducts) ||
    adminProducts.length === 0
  ) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          No products found.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    adminProducts.map(product => {

      const id =
        product.id;

      const title =
        product.title ||
        product.name ||
        "Untitled";


      const seller =
        product.seller_name ||
        product.seller ||
        product.username ||
        product.seller_email ||
        "—";


      const price =
        product.price ??
        0;


      const status =
        product.status ||
        "pending";


      const normalized =
        String(status).toLowerCase();


      let actions = "";


      if (normalized === "pending") {

        actions = `
          <button
            class="btn approve"
            onclick="approveProduct(${Number(id)})"
          >
            Approve
          </button>

          <button
            class="btn reject"
            onclick="rejectProduct(${Number(id)})"
          >
            Reject
          </button>
        `;

      } else {

        actions = `
          <button
            class="btn view"
            onclick="viewProduct(${Number(id)})"
          >
            View
          </button>
        `;
      }


      return `
        <tr>
          <td>${escapeHTML(title)}</td>

          <td>${escapeHTML(seller)}</td>

          <td>
            RWF ${formatMoney(price)}
          </td>

          <td>
            ${escapeHTML(status)}
          </td>

          <td>
            ${actions}
          </td>
        </tr>
      `;

    }).join("");

}


/* =========================================================
   APPROVE PRODUCT
   ========================================================= */

async function approveProduct(productId) {

  if (!productId) return;


  if (
    !confirm(
      "Approve this product?"
    )
  ) {
    return;
  }


  try {

    await apiFetch(
      `/api/admin/products/${productId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "approved"
        })
      }
    );


    showMessage(
      "✅ Product approved.",
      "success"
    );


    await loadAdminProducts();

    await loadAdminDashboard();

  } catch (error) {

    console.error(error);

    showMessage(
      "Could not approve product: " +
      error.message
    );
  }

}


/* =========================================================
   REJECT PRODUCT
   ========================================================= */

async function rejectProduct(productId) {

  if (!productId) return;


  if (
    !confirm(
      "Reject this product?"
    )
  ) {
    return;
  }


  try {

    await apiFetch(
      `/api/admin/products/${productId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "rejected"
        })
      }
    );


    showMessage(
      "❌ Product rejected.",
      "success"
    );


    await loadAdminProducts();

    await loadAdminDashboard();

  } catch (error) {

    console.error(error);

    showMessage(
      "Could not reject product: " +
      error.message
    );
  }

}


/* =========================================================
   VIEW PRODUCT
   ========================================================= */

function viewProduct(productId) {

  const product =
    adminProducts.find(
      item =>
        Number(item.id) ===
        Number(productId)
    );


  if (!product) {

    showMessage(
      "Product not found."
    );

    return;
  }


  alert(
    [
      "Product:",
      product.title || product.name || "—",
      "",
      "Status:",
      product.status || "—",
      "",
      "Price:",
      "RWF " +
        formatMoney(product.price)
    ].join("\n")
  );

}


/* =========================================================
   USERS
   ========================================================= */

async function loadAdminUsers() {

  try {

    const data =
      await apiFetch("/api/admin/users");


    adminUsers =
      data.users ||
      data.data ||
      [];


    renderAdminUsers();

  } catch (error) {

    console.error(
      "Users error:",
      error
    );

    showMessage(
      "Could not load users."
    );
  }

}


function renderAdminUsers() {

  const section =
    $("users");

  if (!section) return;


  const table =
    section.querySelector("table");

  if (!table) return;


  const tbody =
    table.querySelector("tbody");


  if (!tbody) return;


  if (
    !Array.isArray(adminUsers) ||
    adminUsers.length === 0
  ) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          No users found.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    adminUsers.map(user => {

      const name =
        user.name ||
        user.username ||
        "—";


      const email =
        user.email ||
        "—";


      const role =
        user.role ||
        "buyer";


      const status =
        user.status ||
        "active";


      const id =
        user.id;


      return `
        <tr>

          <td>
            ${escapeHTML(name)}
          </td>

          <td>
            ${escapeHTML(email)}
          </td>

          <td>
            ${escapeHTML(role)}
          </td>

          <td>
            ${escapeHTML(status)}
          </td>

          <td>

            <button
              class="btn view"
              onclick="viewUser(${Number(id)})"
            >
              View
            </button>

          </td>

        </tr>
      `;

    }).join("");

}


/* =========================================================
   VIEW USER
   ========================================================= */

function viewUser(userId) {

  const user =
    adminUsers.find(
      item =>
        Number(item.id) ===
        Number(userId)
    );


  if (!user) {

    showMessage(
      "User not found."
    );

    return;
  }


  alert(
    [
      "Name: " +
        (user.name ||
        user.username ||
        "—"),

      "Email: " +
        (user.email || "—"),

      "Role: " +
        (user.role || "—"),

      "Status: " +
        (user.status || "active")
    ].join("\n")
  );

}


/* =========================================================
   REPORTS
   ========================================================= */

async function loadAdminReports() {

  try {

    const data =
      await apiFetch("/api/admin/reports");


    adminReports =
      data.reports ||
      data.data ||
      data;


    renderAdminReports();

  } catch (error) {

    console.error(
      "Reports error:",
      error
    );

    showMessage(
      "Could not load reports."
    );
  }

}


function renderAdminReports() {

  const section =
    $("reports");

  if (!section) return;


  /*
    Worker reports endpoint currently
    returns grouped report/stat data.
  */

  const oldDynamic =
    section.querySelector(
      ".dynamic-admin-reports"
    );


  if (oldDynamic) {
    oldDynamic.remove();
  }


  const box =
    document.createElement("div");

  box.className =
    "dynamic-admin-reports";


  box.style.marginTop = "20px";


  let content = "";


  if (
    adminReports &&
    typeof adminReports === "object"
  ) {

    if (Array.isArray(adminReports)) {

      content =
        adminReports.map(item => `
          <div class="report">
            <strong>
              ${escapeHTML(
                item.status ||
                item.payment_status ||
                "Report"
              )}
            </strong>

            <p>
              Count:
              ${formatMoney(
                item.count || 0
              )}
            </p>

            <p>
              Total:
              RWF ${formatMoney(
                item.total || 0
              )}
            </p>
          </div>
        `).join("");

    } else {

      content = `
        <div class="report">
          <strong>Admin Report Summary</strong>

          <pre style="
            white-space:pre-wrap;
            margin-top:10px;
            font-family:Arial,sans-serif;
          ">${escapeHTML(
            JSON.stringify(
              adminReports,
              null,
              2
            )
          )}</pre>
        </div>
      `;
    }

  }


  if (!content) {

    content = `
      <div class="report">
        No report data available.
      </div>
    `;
  }


  box.innerHTML = content;

  section.appendChild(box);

}


/* =========================================================
   REPORT ACTION
   ========================================================= */

function handleReport(id) {

  alert(
    "Report #" +
    id +
    " selected."
  );

}


/* =========================================================
   SERVICES
   ========================================================= */

async function loadAdminServices() {

  try {

    const data =
      await apiFetch(
        "/api/admin/services"
      );


    adminServices =
      data.services ||
      data.data ||
      [];


    console.log(
      "Admin services:",
      adminServices
    );

  } catch (error) {

    console.error(
      "Services error:",
      error
    );

  }

}


/* =========================================================
   CATEGORIES
   ========================================================= */

async function loadAdminCategories() {

  try {

    const data =
      await apiFetch(
        "/api/admin/categories"
      );


    adminCategories =
      data.categories ||
      data.data ||
      [];


    console.log(
      "Admin categories:",
      adminCategories
    );

  } catch (error) {

    console.error(
      "Categories error:",
      error
    );

  }

}


/* =========================================================
   ORDERS
   ========================================================= */

async function loadAdminOrders() {

  try {

    const data =
      await apiFetch(
        "/api/admin/orders"
      );


    adminOrders =
      data.orders ||
      data.data ||
      [];


    console.log(
      "Admin orders:",
      adminOrders
    );

  } catch (error) {

    console.error(
      "Orders error:",
      error
    );

  }

}


/* =========================================================
   PAYMENTS
   ========================================================= */

async function loadAdminPayments() {

  try {

    const data =
      await apiFetch(
        "/api/admin/payments"
      );


    console.log(
      "Admin payments:",
      data
    );

  } catch (error) {

    console.error(
      "Payments error:",
      error
    );

  }

}


/* =========================================================
   ORDERS STATUS
   ========================================================= */

async function updateOrderStatus(
  orderId,
  status,
  paymentStatus
) {

  if (!orderId) return;


  const body = {
    status
  };


  if (paymentStatus) {

    body.payment_status =
      paymentStatus;
  }


  try {

    await apiFetch(
      `/api/admin/orders/${orderId}`,
      {
        method: "PATCH",
        body: JSON.stringify(body)
      }
    );


    showMessage(
      "Order updated successfully.",
      "success"
    );


    await loadAdminOrders();

    await loadAdminDashboard();

  } catch (error) {

    console.error(error);

    showMessage(
      "Could not update order: " +
      error.message
    );
  }

}


/* =========================================================
   MESSAGES
   ========================================================= */

async function loadAdminMessages() {

  /*
    The current Worker does not have a dedicated
    /api/admin/messages endpoint.

    We therefore keep this section informational
    instead of inventing an API.
  */

  console.log(
    "Admin messages section loaded."
  );

}


/* =========================================================
   SETTINGS
   ========================================================= */

async function loadAdminSettings() {

  /*
    Settings shown here are security/status
    information. Sensitive Worker secrets are
    NEVER requested or displayed in the browser.
  */

  const section =
    $("settings");

  if (!section) return;


  const currentRole =
    currentAdmin?.role ||
    "admin";


  const roleElement =
    section.querySelector(
      "strong"
    );


  if (roleElement) {
    roleElement.textContent =
      String(currentRole).toUpperCase();
  }

}


/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadAllAdminData() {

  await Promise.allSettled([

    loadAdminDashboard(),

    loadAdminProducts(),

    loadAdminUsers(),

    loadAdminReports(),

    loadAdminServices(),

    loadAdminCategories(),

    loadAdminOrders(),

    loadAdminPayments()

  ]);

}


/* =========================================================
   VISIBILITY / SESSION PROTECTION
   ========================================================= */

document.addEventListener(
  "visibilitychange",
  function() {

    if (
      document.visibilityState ===
      "visible"
    ) {

      checkAdminSession();

    }

  }
);


/* =========================================================
   LOGIN ENTER KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Enter" &&
      document.activeElement &&
      (
        document.activeElement.id ===
          "adminUsername" ||
        document.activeElement.id ===
          "adminPassword"
      )
    ) {

      adminLogin();

    }

  }
);


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    checkAdminSession();

  }
);
