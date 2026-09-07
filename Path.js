const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS
    }
  });
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function getToken(request) {
  const auth = request.headers.get("Authorization") || "";

  if (!auth.startsWith("Bearer ")) {
    return null;
  }

  return auth.slice(7).trim();
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);

  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeId() {
  return crypto.randomUUID();
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "buyer",
    district: user.district || "",
    avatar: user.avatar || "",
    created_at: user.created_at || null
  };
}

async function currentUser(request, env) {
  const token = getToken(request);

  if (!token || !env.DB) {
    return null;
  }

  const tokenHash = await sha256(token);

  return await env.DB.prepare(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,
      u.district,
      u.avatar,
      u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
    LIMIT 1
  `)
    .bind(tokenHash)
    .first();
}

function requireUser(user) {
  if (!user) {
    return json({
      success: false,
      error: "Authentication required"
    }, 401);
  }

  return null;
}


/* =========================
   HEALTH
========================= */

async function health(env) {
  let database = false;

  try {
    await env.DB.prepare("SELECT 1").first();
    database = true;
  } catch {
    database = false;
  }

  return json({
    success: true,
    app: "IsokoHub",
    status: "online",
    database
  });
}


/* =========================
   CONFIG
========================= */

async function config(env) {
  return json({
    success: true,
    app: "IsokoHub",
    currency: "RWF",
    payments: {
      enabled: false,
      status: "unconfigured"
    },
    storage: {
      r2: Boolean(env.IMAGES)
    }
  });
}


/* =========================
   REGISTER
========================= */

async function register(request, env) {
  const data = await readBody(request);

  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");
  const phone = String(data.phone || "").trim();
  const district = String(data.district || "").trim();

  if (!name || !email || !password) {
    return json({
      success: false,
      error: "Name, email and password are required"
    }, 400);
  }

  if (password.length < 6) {
    return json({
      success: false,
      error: "Password must contain at least 6 characters"
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT id
    FROM users
    WHERE email = ?
    LIMIT 1
  `)
    .bind(email)
    .first();

  if (existing) {
    return json({
      success: false,
      error: "Email already registered"
    }, 409);
  }

  const userId = makeId();
  const passwordHash = await sha256(
    `${env.AUTH_PEPPER || ""}:${password}`
  );

  await env.DB.prepare(`
    INSERT INTO users (
      id,
      name,
      email,
      phone,
      password_hash,
      role,
      district
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      userId,
      name,
      email,
      phone,
      passwordHash,
      "buyer",
      district
    )
    .run();

  const token = makeId() + makeId();
  const tokenHash = await sha256(token);

  await env.DB.prepare(`
    INSERT INTO sessions (
      id,
      user_id,
      token_hash
    )
    VALUES (?, ?, ?)
  `)
    .bind(
      makeId(),
      userId,
      tokenHash
    )
    .run();

  const user = await env.DB.prepare(`
    SELECT
      id,
      name,
      email,
      phone,
      role,
      district,
      avatar,
      created_at
    FROM users
    WHERE id = ?
    LIMIT 1
  `)
    .bind(userId)
    .first();

  return json({
    success: true,
    token,
    user: publicUser(user)
  }, 201);
}


/* =========================
   LOGIN
========================= */

async function login(request, env) {
  const data = await readBody(request);

  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  if (!email || !password) {
    return json({
      success: false,
      error: "Email and password are required"
    }, 400);
  }

  const passwordHash = await sha256(
    `${env.AUTH_PEPPER || ""}:${password}`
  );

  const user = await env.DB.prepare(`
    SELECT *
    FROM users
    WHERE email = ?
      AND password_hash = ?
    LIMIT 1
  `)
    .bind(email, passwordHash)
    .first();

  if (!user) {
    return json({
      success: false,
      error: "Invalid email or password"
    }, 401);
  }

  const token = makeId() + makeId();
  const tokenHash = await sha256(token);

  await env.DB.prepare(`
    INSERT INTO sessions (
      id,
      user_id,
      token_hash
    )
    VALUES (?, ?, ?)
  `)
    .bind(
      makeId(),
      user.id,
      tokenHash
    )
    .run();

  return json({
    success: true,
    token,
    user: publicUser(user)
  });
}


/* =========================
   LOGOUT
========================= */

async function logout(request, env) {
  const token = getToken(request);

  if (token) {
    const tokenHash = await sha256(token);

    await env.DB.prepare(`
      DELETE FROM sessions
      WHERE token_hash = ?
    `)
      .bind(tokenHash)
      .run();
  }

  return json({
    success: true,
    message: "Logged out successfully"
  });
}


/* =========================
   ME
========================= */

async function me(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  return json({
    success: true,
    user: publicUser(user)
  });
}


/* =========================
   PRODUCTS
========================= */

async function listProducts(request, env) {
  const url = new URL(request.url);

  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const district = url.searchParams.get("district") || "";
  const seller = url.searchParams.get("seller") || "";

  let sql = `
    SELECT
      p.*,
      u.name AS seller_name
    FROM products p
    LEFT JOIN users u
      ON u.id = p.seller_id
    WHERE p.status = 'approved'
  `;

  const params = [];

  if (search) {
    sql += `
      AND (
        p.title LIKE ?
        OR p.description LIKE ?
        OR p.brand LIKE ?
        OR p.category LIKE ?
      )
    `;

    const q = `%${search}%`;

    params.push(q, q, q, q);
  }

  if (category) {
    sql += " AND p.category = ?";
    params.push(category);
  }

  if (district) {
    sql += " AND p.district = ?";
    params.push(district);
  }

  if (seller) {
    sql += " AND p.seller_id = ?";
    params.push(seller);
  }

  sql += `
    ORDER BY p.created_at DESC
    LIMIT 100
  `;

  const result = await env.DB
    .prepare(sql)
    .bind(...params)
    .all();

  return json({
    success: true,
    products: result.results || []
  });
}


/* =========================
   SINGLE PRODUCT
========================= */

async function getProduct(productId, env) {
  const product = await env.DB.prepare(`
    SELECT
      p.*,
      u.name AS seller_name,
      u.phone AS seller_phone
    FROM products p
    LEFT JOIN users u
      ON u.id = p.seller_id
    WHERE p.id = ?
    LIMIT 1
  `)
    .bind(productId)
    .first();

  if (!product) {
    return json({
      success: false,
      error: "Product not found"
    }, 404);
  }

  return json({
    success: true,
    product
  });
}


/* =========================
   CREATE PRODUCT
========================= */

async function createProduct(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  const data = await readBody(request);

  const title = String(data.title || "").trim();
  const description = String(data.description || "").trim();
  const price = Number(data.price || 0);

  if (!title) {
    return json({
      success: false,
      error: "Product title is required"
    }, 400);
  }

  if (!Number.isFinite(price) || price < 0) {
    return json({
      success: false,
      error: "Valid price is required"
    }, 400);
  }

  const productId = makeId();

  const images = Array.isArray(data.images)
    ? JSON.stringify(data.images)
    : "[]";

  await env.DB.prepare(`
    INSERT INTO products (
      id,
      seller_id,
      title,
      description,
      price,
      currency,
      category,
      brand,
      condition,
      district,
      image,
      images,
      model,
      ram,
      storage,
      negotiable,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      productId,
      user.id,
      title,
      description,
      price,
      String(data.currency || "RWF"),
      String(data.category || ""),
      String(data.brand || ""),
      String(data.condition || ""),
      String(data.district || user.district || ""),
      String(data.image || ""),
      images,
      String(data.model || ""),
      String(data.ram || ""),
      String(data.storage || ""),
      data.negotiable ? 1 : 0,
      "pending"
    )
    .run();

  return json({
    success: true,
    message: "Product submitted for review",
    product_id: productId,
    status: "pending"
  }, 201);
}


/* =========================
   MY PRODUCTS
========================= */

async function myProducts(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  const result = await env.DB.prepare(`
    SELECT *
    FROM products
    WHERE seller_id = ?
    ORDER BY created_at DESC
  `)
    .bind(user.id)
    .all();

  return json({
    success: true,
    products: result.results || []
  });
}


/* =========================
   ORDERS
========================= */

async function listOrders(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  const result = await env.DB.prepare(`
    SELECT
      o.*,
      p.title AS product_title,
      p.image AS product_image,
      b.name AS buyer_name,
      s.name AS seller_name
    FROM orders o
    LEFT JOIN products p
      ON p.id = o.product_id
    LEFT JOIN users b
      ON b.id = o.buyer_id
    LEFT JOIN users s
      ON s.id = o.seller_id
    WHERE o.buyer_id = ?
       OR o.seller_id = ?
    ORDER BY o.created_at DESC
  `)
    .bind(user.id, user.id)
    .all();

  return json({
    success: true,
    orders: result.results || []
  });
}


/* =========================
   CREATE ORDER
========================= */

async function createOrder(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  const data = await readBody(request);

  const productId = String(data.product_id || "");
  const quantity = Math.max(
    1,
    Number(data.quantity || 1)
  );

  if (!productId) {
    return json({
      success: false,
      error: "product_id is required"
    }, 400);
  }

  const product = await env.DB.prepare(`
    SELECT *
    FROM products
    WHERE id = ?
      AND status = 'approved'
    LIMIT 1
  `)
    .bind(productId)
    .first();

  if (!product) {
    return json({
      success: false,
      error: "Product not found"
    }, 404);
  }

  if (product.seller_id === user.id) {
    return json({
      success: false,
      error: "You cannot order your own product"
    }, 400);
  }

  const total = Number(product.price) * quantity;
  const orderId = makeId();

  await env.DB.prepare(`
    INSERT INTO orders (
      id,
      buyer_id,
      seller_id,
      product_id,
      quantity,
      total,
      currency,
      status,
      delivery_address
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      orderId,
      user.id,
      product.seller_id,
      product.id,
      quantity,
      total,
      product.currency || "RWF",
      "unpaid",
      String(data.delivery_address || "")
    )
    .run();

  return json({
    success: true,
    order: {
      id: orderId,
      product_id: product.id,
      quantity,
      total,
      currency: product.currency || "RWF",
      status: "unpaid"
    }
  }, 201);
}


/* =========================
   MESSAGES
========================= */

async function listMessages(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  const url = new URL(request.url);
  const withUser = url.searchParams.get("with") || "";

  let result;

  if (withUser) {
    result = await env.DB.prepare(`
      SELECT
        m.*,
        s.name AS sender_name,
        r.name AS receiver_name
      FROM messages m
      LEFT JOIN users s
        ON s.id = m.sender_id
      LEFT JOIN users r
        ON r.id = m.receiver_id
      WHERE
        (
          m.sender_id = ?
          AND m.receiver_id = ?
        )
        OR
        (
          m.sender_id = ?
          AND m.receiver_id = ?
        )
      ORDER BY m.created_at ASC
      LIMIT 200
    `)
      .bind(
        user.id,
        withUser,
        withUser,
        user.id
      )
      .all();
  } else {
    result = await env.DB.prepare(`
      SELECT
        m.*,
        s.name AS sender_name,
        r.name AS receiver_name
      FROM messages m
      LEFT JOIN users s
        ON s.id = m.sender_id
      LEFT JOIN users r
        ON r.id = m.receiver_id
      WHERE
        m.sender_id = ?
        OR m.receiver_id = ?
      ORDER BY m.created_at DESC
      LIMIT 200
    `)
      .bind(user.id, user.id)
      .all();
  }

  return json({
    success: true,
    messages: result.results || []
  });
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  const data = await readBody(request);

  const receiverId = String(data.receiver_id || "");
  const message = String(data.message || "").trim();

  if (!receiverId || !message) {
    return json({
      success: false,
      error: "receiver_id and message are required"
    }, 400);
  }

  const receiver = await env.DB.prepare(`
    SELECT id
    FROM users
    WHERE id = ?
    LIMIT 1
  `)
    .bind(receiverId)
    .first();

  if (!receiver) {
    return json({
      success: false,
      error: "Receiver not found"
    }, 404);
  }

  const messageId = makeId();

  await env.DB.prepare(`
    INSERT INTO messages (
      id,
      sender_id,
      receiver_id,
      message
    )
    VALUES (?, ?, ?, ?)
  `)
    .bind(
      messageId,
      user.id,
      receiverId,
      message
    )
    .run();

  return json({
    success: true,
    message: {
      id: messageId,
      sender_id: user.id,
      receiver_id: receiverId,
      message
    }
  }, 201);
}


/* =========================
   ADMIN PRODUCTS
========================= */

async function adminProducts(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  if (user.role !== "admin") {
    return json({
      success: false,
      error: "Admin access required"
    }, 403);
  }

  const result = await env.DB.prepare(`
    SELECT
      p.*,
      u.name AS seller_name,
      u.email AS seller_email
    FROM products p
    LEFT JOIN users u
      ON u.id = p.seller_id
    ORDER BY p.created_at DESC
  `)
    .all();

  return json({
    success: true,
    products: result.results || []
  });
}


/* =========================
   ADMIN UPDATE STATUS
========================= */

async function updateProductStatus(
  request,
  env,
  productId
) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  if (user.role !== "admin") {
    return json({
      success: false,
      error: "Admin access required"
    }, 403);
  }

  const data = await readBody(request);
  const status = String(data.status || "");

  const allowed = [
    "pending",
    "approved",
    "rejected",
    "sold"
  ];

  if (!allowed.includes(status)) {
    return json({
      success: false,
      error: "Invalid product status"
    }, 400);
  }

  const result = await env.DB.prepare(`
    UPDATE products
    SET status = ?
    WHERE id = ?
  `)
    .bind(status, productId)
    .run();

  if (!result.meta || result.meta.changes === 0) {
    return json({
      success: false,
      error: "Product not found"
    }, 404);
  }

  return json({
    success: true,
    message: "Product status updated",
    status
  });
}


/* =========================
   R2 IMAGE UPLOAD
========================= */

async function uploadImage(request, env) {
  const user = await currentUser(request, env);

  const error = requireUser(user);
  if (error) return error;

  if (!env.IMAGES) {
    return json({
      success: false,
      error: "R2 image storage is not configured"
    }, 503);
  }

  const contentType =
    request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return json({
      success: false,
      error: "multipart/form-data is required"
    }, 400);
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!file || typeof file.arrayBuffer !== "function") {
    return json({
      success: false,
      error: "Image file is required"
    }, 400);
  }

  const extension =
    String(file.name || "image.jpg")
      .split(".")
      .pop()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";

  const key =
    `users/${user.id}/${makeId()}.${extension}`;

  await env.IMAGES.put(
    key,
    await file.arrayBuffer(),
    {
      httpMetadata: {
        contentType:
          file.type || "application/octet-stream"
      }
    }
  );

  return json({
    success: true,
    key,
    url: `/api/images/${encodeURIComponent(key)}`
  }, 201);
}


/* =========================
   R2 IMAGE GET
========================= */

async function getImage(env, key) {
  if (!env.IMAGES) {
    return new Response("R2 not configured", {
      status: 503,
      headers: CORS
    });
  }

  const object = await env.IMAGES.get(key);

  if (!object) {
    return new Response("Image not found", {
      status: 404,
      headers: CORS
    });
  }

  const headers = new Headers(CORS);

  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, {
    headers
  });
}


/* =========================
   MAIN ROUTER
========================= */

export async function onRequest(context) {
  const {
    request,
    env
  } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS
    });
  }

  const url = new URL(request.url);
  const path =
    url.pathname.replace(/\/+$/, "") || "/";
  const method =
    request.method.toUpperCase();

  try {
    if (!env.DB) {
      return json({
        success: false,
        error: "D1 binding DB is not configured"
      }, 500);
    }

    if (
      path === "/api/health" &&
      method === "GET"
    ) {
      return await health(env);
    }

    if (
      path === "/api/config" &&
      method === "GET"
    ) {
      return await config(env);
    }

    if (
      path === "/api/auth/register" &&
      method === "POST"
    ) {
      return await register(request, env);
    }

    if (
      path === "/api/auth/login" &&
      method === "POST"
    ) {
      return await login(request, env);
    }

    if (
      path === "/api/auth/logout" &&
      method === "POST"
    ) {
      return await logout(request, env);
    }

    if (
      path === "/api/auth/me" &&
      method === "GET"
    ) {
      return await me(request, env);
    }

    if (
      path === "/api/products" &&
      method === "GET"
    ) {
      return await listProducts(request, env);
    }

    if (
      path === "/api/products" &&
      method === "POST"
    ) {
      return await createProduct(request, env);
    }

    if (
      path === "/api/my-products" &&
      method === "GET"
    ) {
      return await myProducts(request, env);
    }

    if (
      path === "/api/orders" &&
      method === "GET"
    ) {
      return await listOrders(request, env);
    }

    if (
      path === "/api/orders" &&
      method === "POST"
    ) {
      return await createOrder(request, env);
    }

    if (
      path === "/api/messages" &&
      method === "GET"
    ) {
      return await listMessages(request, env);
    }

    if (
      path === "/api/messages" &&
      method === "POST"
    ) {
      return await sendMessage(request, env);
    }

    if (
      path === "/api/admin/products" &&
      method === "GET"
    ) {
      return await adminProducts(request, env);
    }

    if (
      path === "/api/images" &&
      method === "POST"
    ) {
      return await uploadImage(request, env);
    }

    const productMatch =
      path.match(/^\/api\/products\/([^/]+)$/);

    if (
      productMatch &&
      method === "GET"
    ) {
      return await getProduct(
        productMatch[1],
        env
      );
    }

    const statusMatch =
      path.match(
        /^\/api\/admin\/products\/([^/]+)\/status$/
      );

    if (
      statusMatch &&
      method === "PATCH"
    ) {
      return await updateProductStatus(
        request,
        env,
        statusMatch[1]
      );
    }

    const imageMatch =
      path.match(/^\/api\/images\/(.+)$/);

    if (
      imageMatch &&
      method === "GET"
    ) {
      return await getImage(
        env,
        decodeURIComponent(imageMatch[1])
      );
    }

    return json({
      success: false,
      error: "API route not found",
      path
    }, 404);

  } catch (error) {
    console.error(
      "IsokoHub API error:",
      error
    );

    return json({
      success: false,
      error: "Internal server error",
      message: error?.message || "Unknown error"
    }, 500);
  }
}
