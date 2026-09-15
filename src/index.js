const CORS = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type, Authorization",
"Access-Control-Max-Age": "86400"
};

const COMMISSION_RATE = 0.05;

const json = (data, status = 200) =>
new Response(JSON.stringify(data), {
status,
headers: {
...CORS,
"Content-Type": "application/json; charset=utf-8"
}
});

async function readJSON(request) {
try {
return await request.json();
} catch {
return {};
}
}

async function sha256(value) {
const data = new TextEncoder().encode(value);
const hash = await crypto.subtle.digest("SHA-256", data);

return [...new Uint8Array(hash)]
.map(b => b.toString(16).padStart(2, "0"))
.join("");
}

function tokenFromRequest(request) {
const auth = request.headers.get("Authorization") || "";

if (auth.startsWith("Bearer ")) {
return auth.slice(7).trim();
}

return null;
}

async function authenticate(request, env) {
const token = tokenFromRequest(request);

if (!token) return null;

const tokenHash = await sha256(token);

return await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1 LIMIT 1").bind(tokenHash).first();
}

function safeUser(user) {
if (!user) return null;

return {
id: user.id,
name: user.name,
email: user.email,
role: user.role,
phone: user.phone,
country: user.country,
district: user.district,
avatar_url: user.avatar_url,
bio: user.bio,
is_verified: user.is_verified,
created_at: user.created_at
};
}

function requireDB(env) {
if (!env.DB) {
throw new Error("D1 database binding DB is missing");
}
}

async function requireUser(request, env) {
const user = await authenticate(request, env);

if (!user) {
throw new Error("UNAUTHORIZED");
}

return user;
}

async function requireAdmin(request, env) {
const user = await requireUser(request, env);

if (user.role !== "admin") {
throw new Error("ADMIN_ONLY");
}

return user;
}

function number(value, fallback = 0) {
const n = Number(value);

return Number.isFinite(n) ? n : fallback;
}

export default {
async fetch(request, env) {
const url = new URL(request.url);
const path = url.pathname;
const method = request.method;

if (method === "OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: CORS
  });
}

try {
  requireDB(env);

  // ==================================================
  // HEALTH
  // ==================================================

  if (path === "/api/health" && method === "GET") {
    let database = "not_connected";

    try {
      await env.DB.prepare("SELECT 1").first();
      database = "connected";
    } catch {
      database = "error";
    }

    return json({
      ok: database === "connected",
      service: "IsokoHub API",
      database,
      time: new Date().toISOString()
    });
  }

  // ==================================================
  // CONFIG
  // ==================================================

  if (path === "/api/config" && method === "GET") {
    return json({
      ok: true,
      environment: "production",
      platform: "cloudflare-workers",
      database: "D1",
      assets: "Cloudflare Assets",
      marketplace: "global",
      commission_rate: COMMISSION_RATE
    });
  }

  // ==================================================
  // CATEGORIES
  // ==================================================

  if (path === "/api/categories" && method === "GET") {
    const result = await env.DB.prepare(`
      SELECT id, name, description, icon, is_active, created_at
      FROM categories
      WHERE is_active = 1
      ORDER BY id
    `).all();

    return json({
      ok: true,
      categories: result.results || []
    });
  }

  // ==================================================
  // PRODUCTS - LIST
  // ==================================================

  if (path === "/api/products" && method === "GET") {
    const search = (url.searchParams.get("search") || "").trim();
    const category = (url.searchParams.get("category") || "").trim();
    const country = (url.searchParams.get("country") || "").trim();

    const limit = Math.min(
      Math.max(number(url.searchParams.get("limit"), 50), 1),
      100
    );

    let sql = `
      SELECT
        p.*,
        u.name AS seller_name,
        u.email AS seller_email,
        u.country AS seller_country,
        u.district AS seller_district,
        u.is_verified AS seller_verified
      FROM products p
      JOIN users u ON u.id = p.seller_id
      WHERE p.status = 'active'
        AND u.is_active = 1
    `;

    const params = [];

    if (search) {
      sql += `
        AND (
          p.title LIKE ?
          OR p.description LIKE ?
          OR p.category LIKE ?
          OR p.brand LIKE ?
          OR p.model LIKE ?
        )
      `;

      const q = `%${search}%`;

      params.push(q, q, q, q, q);
    }

    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (country) {
      sql += ` AND p.country = ?`;
      params.push(country);
    }

    sql += `
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    params.push(limit);

    const result = await env.DB
      .prepare(sql)
      .bind(...params)
      .all();

    return json({
      ok: true,
      products: result.results || []
    });
  }

  // ==================================================
  // SINGLE PRODUCT
  // ==================================================

  const productMatch = path.match(
    /^\/api\/products\/(\d+)$/
  );

  if (productMatch && method === "GET") {
    const id = Number(productMatch[1]);

    const product = await env.DB.prepare(`
      SELECT
        p.*,
        u.name AS seller_name,
        u.email AS seller_email,
        u.phone AS seller_phone,
        u.country AS seller_country,
        u.district AS seller_district,
        u.is_verified AS seller_verified
      FROM products p
      JOIN users u ON u.id = p.seller_id
      WHERE p.id = ?
      LIMIT 1
    `).bind(id).first();

    if (!product) {
      return json({
        ok: false,
        error: "Product not found"
      }, 404);
    }

    await env.DB.prepare(`
      UPDATE products
      SET views = views + 1
      WHERE id = ?
    `).bind(id).run();

    return json({
      ok: true,
      product: {
        ...product,
        views: Number(product.views || 0) + 1,
        images: product.image_url
          ? [product.image_url]
          : []
      }
    });
  }

  // ==================================================
  // REGISTER
  // ==================================================

  if (path === "/api/register" && method === "POST") {
    const body = await readJSON(request);

    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");
    const phone = String(body.phone || "").trim();
    const country = String(
      body.country || "Rwanda"
    ).trim();

    const district = String(
      body.district || ""
    ).trim();

    if (!name || !email || !password) {
      return json({
        ok: false,
        error: "Name, email and password are required"
      }, 400);
    }

    if (password.length < 6) {
      return json({
        ok: false,
        error: "Password must contain at least 6 characters"
      }, 400);
    }

    const existing = await env.DB.prepare(`
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
    `).bind(email).first();

    if (existing) {
      return json({
        ok: false,
        error: "Email already registered"
      }, 409);
    }

    const passwordHash = await sha256(password);

    const result = await env.DB.prepare(`
      INSERT INTO users
      (
        name,
        email,
        password_hash,
        role,
        phone,
        country,
        district
      )
      VALUES (?, ?, ?, 'buyer', ?, ?, ?)
    `).bind(
      name,
      email,
      passwordHash,
      phone || null,
      country || "Rwanda",
      district || null
    ).run();

    return json({
      ok: true,
      message: "Registration successful",
      userId: result.meta?.last_row_id
    }, 201);
  }

  // ==================================================
  // LOGIN
  // ==================================================

  if (path === "/api/login" && method === "POST") {
    const body = await readJSON(request);

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!email || !password) {
      return json({
        ok: false,
        error: "Email and password are required"
      }, 400);
    }

    const user = await env.DB.prepare(`
      SELECT *
      FROM users
      WHERE email = ?
        AND is_active = 1
      LIMIT 1
    `).bind(email).first();

    if (!user) {
      return json({
        ok: false,
        error: "Invalid email or password"
      }, 401);
    }

    const passwordHash = await sha256(password);

    if (passwordHash !== user.password_hash) {
      return json({
        ok: false,
        error: "Invalid email or password"
      }, 401);
    }

    const token =
      crypto.randomUUID() +
      crypto.randomUUID();

    const tokenHash = await sha256(token);

    await env.DB.prepare(`
      INSERT INTO sessions
      (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (
        ?,
        ?,
        datetime('now', '+30 days')
      )
    `).bind(
      user.id,
      tokenHash
    ).run();

    return json({
      ok: true,
      token,
      user: safeUser(user)
    });
  }

  // ==================================================
  // ME
  // ==================================================

  if (path === "/api/me" && method === "GET") {
    const user = await authenticate(request, env);

    if (!user) {
      return json({
        ok: false,
        user: null
      }, 401);
    }

    return json({
      ok: true,
      user: safeUser(user)
    });
  }

  // ==================================================
  // UPDATE PROFILE
  // ==================================================

  if (path === "/api/me" && method === "PATCH") {
    const user = await requireUser(request, env);
    const body = await readJSON(request);

    const name = String(
      body.name ?? user.name
    ).trim();

    const phone = String(
      body.phone ?? user.phone ?? ""
    ).trim();

    const country = String(
      body.country ?? user.country ?? ""
    ).trim();

    const district = String(
      body.district ?? user.district ?? ""
    ).trim();

    const avatarUrl = String(
      body.avatar_url ??
      user.avatar_url ??
      ""
    ).trim();

    const bio = String(
      body.bio ??
      user.bio ??
      ""
    ).trim();

    await env.DB.prepare(`
      UPDATE users
      SET
        name = ?,
        phone = ?,
        country = ?,
        district = ?,
        avatar_url = ?,
        bio = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      phone || null,
      country || null,
      district || null,
      avatarUrl || null,
      bio || null,
      user.id
    ).run();

    const updated = await env.DB.prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `).bind(user.id).first();

    return json({
      ok: true,
      user: safeUser(updated)
    });
  }

  // ==================================================
  // LOGOUT
  // ==================================================

  if (path === "/api/logout" && method === "POST") {
    const token = tokenFromRequest(request);

    if (token) {
      const tokenHash = await sha256(token);

      await env.DB.prepare(`
        DELETE FROM sessions
        WHERE token_hash = ?
      `).bind(tokenHash).run();
    }

    return json({
      ok: true,
      message: "Logged out"
    });
  }

  // ==================================================
  // CREATE PRODUCT
  // ==================================================

  if (path === "/api/products" && method === "POST") {
    const user = await requireUser(request, env);
    const body = await readJSON(request);

    const title = String(
      body.title || ""
    ).trim();

    const category = String(
      body.category || ""
    ).trim();

    const price = number(body.price, 0);

    const stock = Math.max(
      number(body.stock, 1),
      0
    );

    if (!title || !category) {
      return json({
        ok: false,
        error: "Title and category are required"
      }, 400);
    }

    if (!Number.isFinite(price) || price < 0) {
      return json({
        ok: false,
        error: "Invalid price"
      }, 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO products (
        seller_id,
        title,
        category,
        description,
        price,
        currency,
        stock,
        brand,
        model,
        condition,
        country,
        district,
        storage,
        ram,
        image_url,
        specs,
        negotiable,
        status
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, 'active'
      )
    `).bind(
      user.id,
      title,
      category,
      String(
        body.description || ""
      ).trim() || null,
      price,
      String(
        body.currency || "RWF"
      ),
      stock,
      String(
        body.brand || ""
      ).trim() || null,
      String(
        body.model || ""
      ).trim() || null,
      String(
        body.condition || ""
      ).trim() || null,
      String(
        body.country ||
        user.country ||
        "Rwanda"
      ),
      String(
        body.district ||
        user.district ||
        ""
      ).trim() || null,
      String(
        body.storage || ""
      ).trim() || null,
      String(
        body.ram || ""
      ).trim() || null,
      String(
        body.image_url || ""
      ).trim() || null,
      String(
        body.specs || ""
      ).trim() || null,
      body.negotiable ? 1 : 0
    ).run();

    return json({
      ok: true,
      message: "Product published successfully",
      productId: result.meta?.last_row_id
    }, 201);
  }

  // ==================================================
  // UPDATE PRODUCT
  // ==================================================

  if (productMatch && method === "PUT") {
    const user = await requireUser(request, env);
    const id = Number(productMatch[1]);
    const body = await readJSON(request);

    const product = await env.DB.prepare(`
      SELECT *
      FROM products
      WHERE id = ?
    `).bind(id).first();

    if (!product) {
      return json({
        ok: false,
        error: "Product not found"
      }, 404);
    }

    if (
      product.seller_id !== user.id &&
      user.role !== "admin"
    ) {
      return json({
        ok: false,
        error: "Not allowed"
      }, 403);
    }

    const price = number(
      body.price ?? product.price,
      product.price
    );

    const stock = Math.max(
      number(
        body.stock ?? product.stock,
        product.stock
      ),
      0
    );

    await env.DB.prepare(`
      UPDATE products
      SET
        title = ?,
        category = ?,
        description = ?,
        price = ?,
        currency = ?,
        stock = ?,
        brand = ?,
        model = ?,
        condition = ?,
        country = ?,
        district = ?,
        storage = ?,
        ram = ?,
        image_url = ?,
        specs = ?,
        negotiable = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      String(
        body.title ??
        product.title
      ),

      String(
        body.category ??
        product.category
      ),

      String(
        body.description ??
        product.description ??
        ""
      ) || null,

      price,

      String(
        body.currency ??
        product.currency
      ),

      stock,

      String(
        body.brand ??
        product.brand ??
        ""
      ) || null,

      String(
        body.model ??
        product.model ??
        ""
      ) || null,

      String(
        body.condition ??
        product.condition ??
        ""
      ) || null,

      String(
        body.country ??
        product.country ??
        "Rwanda"
      ),

      String(
        body.district ??
        product.district ??
        ""
      ) || null,

      String(
        body.storage ??
        product.storage ??
        ""
      ) || null,

      String(
        body.ram ??
        product.ram ??
        ""
      ) || null,

      String(
        body.image_url ??
        product.image_url ??
        ""
      ) || null,

      String(
        body.specs ??
        product.specs ??
        ""
      ) || null,

      body.negotiable === undefined
        ? product.negotiable
        : (body.negotiable ? 1 : 0),

      String(
        body.status ??
        product.status
      ),

      id
    ).run();

    return json({
      ok: true,
      message: "Product updated"
    });
  }

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  if (productMatch && method === "DELETE") {
    const user = await requireUser(request, env);
    const id = Number(productMatch[1]);

    const product = await env.DB.prepare(`
      SELECT seller_id
      FROM products
      WHERE id = ?
    `).bind(id).first();

    if (!product) {
      return json({
        ok: false,
        error: "Product not found"
      }, 404);
    }

    if (
      product.seller_id !== user.id &&
      user.role !== "admin"
    ) {
      return json({
        ok: false,
        error: "Not allowed"
      }, 403);
    }

    await env.DB.prepare(`
      DELETE FROM products
      WHERE id = ?
    `).bind(id).run();

    return json({
      ok: true,
      message: "Product deleted"
    });
  }

  // ==================================================
  // SAVED PRODUCTS
  // ==================================================

  if (path === "/api/saved" && method === "GET") {
    const user = await requireUser(request, env);

    const result = await env.DB.prepare(`
      SELECT
        p.*,
        u.name AS seller_name,
        sp.created_at AS saved_at
      FROM saved_products sp
      JOIN products p
        ON p.id = sp.product_id
      JOIN users u
        ON u.id = p.seller_id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC
    `).bind(user.id).all();

    return json({
      ok: true,
      products: result.results || []
    });
  }

  if (path === "/api/saved" && method === "POST") {
    const user = await requireUser(request, env);
    const body = await readJSON(request);

    const productId = Number(
      body.product_id ??
      body.productId
    );

    if (!Number.isInteger(productId)) {
      return json({
        ok: false,
        error: "Invalid product id"
      }, 400);
    }

    await env.DB.prepare(`
      INSERT OR IGNORE INTO saved_products
      (
        user_id,
        product_id
      )
      VALUES (?, ?)
    `).bind(
      user.id,
      productId
    ).run();

    return json({
      ok: true,
      saved: true
    });
  }

  const savedMatch =
    path.match(/^\/api\/saved\/(\d+)$/);

  if (savedMatch && method === "DELETE") {
    const user = await requireUser(request, env);
    const productId = Number(savedMatch[1]);

    await env.DB.prepare(`
      DELETE FROM saved_products
      WHERE user_id = ?
        AND product_id = ?
    `).bind(
      user.id,
      productId
    ).run();

    return json({
      ok: true,
      saved: false
    });
  }

  // ==================================================
  // ORDERS - USER
  // ==================================================

  if (path === "/api/orders" && method === "GET") {
    const user = await requireUser(request, env);

    const result = await env.DB.prepare(`
      SELECT
        o.*,
        p.title AS product_title,
        p.image_url AS product_image,
        s.name AS seller_name,
        b.name AS buyer_name
      FROM orders o
      JOIN products p
        ON p.id = o.product_id
      LEFT JOIN users s
        ON s.id = o.seller_id
      JOIN users b
        ON b.id = o.buyer_id
      WHERE o.buyer_id = ?
         OR o.seller_id = ?
      ORDER BY o.created_at DESC
    `).bind(
      user.id,
      user.id
    ).all();

    return json({
      ok: true,
      orders: result.results || []
    });
  }

  // ==================================================
  // CREATE ORDER
  // ==================================================

  if (path === "/api/orders" && method === "POST") {
    const user = await requireUser(request, env);
    const body = await readJSON(request);

    const productId = Number(
      body.product_id ??
      body.productId
    );

    const quantity = Math.max(
      number(body.quantity, 1),
      1
    );

    if (!Number.isInteger(productId)) {
      return json({
        ok: false,
        error: "Invalid product id"
      }, 400);
    }

    const product = await env.DB.prepare(`
      SELECT *
      FROM products
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `).bind(productId).first();

    if (!product) {
      return json({
        ok: false,
        error: "Product not found"
      }, 404);
    }

    if (Number(product.stock) < quantity) {
      return json({
        ok: false,
        error: "Not enough stock"
      }, 400);
    }

    if (product.seller_id === user.id) {
      return json({
        ok: false,
        error: "You cannot order your own product"
      }, 400);
    }

    const total =
      Number(product.price) *
      quantity;

    const result = await env.DB.prepare(`
      INSERT INTO orders (
        buyer_id,
        product_id,
        seller_id,
        quantity,
        unit_price,
        total_price,
        currency,
        status,
        payment_status,
        delivery_address,
        delivery_country,
        delivery_district,
        delivery_phone
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        'pending',
        'unpaid',
        ?, ?, ?, ?
      )
    `).bind(
      user.id,
      product.id,
      product.seller_id,
      quantity,
      product.price,
      total,
      product.currency,
      String(
        body.delivery_address || ""
      ).trim() || null,
      String(
        body.delivery_country ||
        user.country ||
        ""
      ).trim() || null,
      String(
        body.delivery_district ||
        user.district ||
        ""
      ).trim() || null,
      String(
        body.delivery_phone ||
        user.phone ||
        ""
      ).trim() || null
    ).run();

    await env.DB.prepare(`
      UPDATE products
      SET
        stock = stock - ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      quantity,
      product.id
    ).run();

    return json({
      ok: true,
      message: "Order created",
      orderId: result.meta?.last_row_id,
      total,
      currency: product.currency,
      payment_status: "unpaid"
    }, 201);
  }

  // ==================================================
  // MESSAGES
  // ==================================================

  if (path === "/api/messages" && method === "GET") {
    const user = await requireUser(request, env);

    const result = await env.DB.prepare(`
      SELECT
        m.*,
        s.name AS sender_name,
        r.name AS receiver_name,
        p.title AS product_title
      FROM messages m
      JOIN users s
        ON s.id = m.sender_id
      JOIN users r
        ON r.id = m.receiver_id
      LEFT JOIN products p
        ON p.id = m.product_id
      WHERE m.sender_id = ?
         OR m.receiver_id = ?
      ORDER BY m.created_at ASC
    `).bind(
      user.id,
      user.id
    ).all();

    return json({
      ok: true,
      messages: result.results || []
    });
  }

  if (path === "/api/messages" && method === "POST") {
    const user = await requireUser(request, env);
    const body = await readJSON(request);

    const receiverId = Number(
      body.receiver_id ??
      body.receiverId
    );

    const message = String(
      body.message ??
      body.body ??
      ""
    ).trim();

    const rawProductId =
      body.product_id ??
      body.productId;

    const productId =
      rawProductId !== undefined &&
      rawProductId !== null &&
      rawProductId !== ""
        ? Number(rawProductId)
        : null;

    if (
      !Number.isInteger(receiverId) ||
      !message
    ) {
      return json({
        ok: false,
        error: "Receiver and message are required"
      }, 400);
    }

    const receiver =
      await env.DB.prepare(`
        SELECT id
        FROM users
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
      `).bind(receiverId).first();

    if (!receiver) {
      return json({
        ok: false,
        error: "Receiver not found"
      }, 404);
    }

    const result = await env.DB.prepare(`
      INSERT INTO messages
      (
        sender_id,
        receiver_id,
        product_id,
        message
      )
      VALUES (?, ?, ?, ?)
    `).bind(
      user.id,
      receiverId,
      productId,
      message
    ).run();

    return json({
      ok: true,
      message: "Message sent",
      messageId: result.meta?.last_row_id
    }, 201);
  }

  // ==================================================
  // SERVICES
  // ==================================================

  if (path === "/api/services" && method === "GET") {
    const limit = Math.min(
      Math.max(
        number(
          url.searchParams.get("limit"),
          50
        ),
        1
      ),
      100
    );

    const result = await env.DB.prepare(`
      SELECT
        p.*,
        u.name AS seller_name,
        u.email AS seller_email,
        u.country AS seller_country,
        u.district AS seller_district,
        u.is_verified AS seller_verified
      FROM products p
      JOIN users u
        ON u.id = p.seller_id
      WHERE p.category = 'Services'
        AND p.status = 'active'
        AND u.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return json({
      ok: true,
      services: result.results || []
    });
  }

  // ==================================================
  // SELLER PRODUCTS
  // ==================================================

  if (
    path === "/api/seller/products" &&
    method === "GET"
  ) {
    const user = await requireUser(
      request,
      env
    );

    const result = await env.DB.prepare(`
      SELECT *
      FROM products
      WHERE seller_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    return json({
      ok: true,
      products: result.results || []
    });
  }

  // ==================================================
  // SELLER STATS
  // ==================================================

  if (
    path === "/api/seller/stats" &&
    method === "GET"
  ) {
    const user = await requireUser(
      request,
      env
    );

    const products =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM products
        WHERE seller_id = ?
      `).bind(user.id).first();

    const activeProducts =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM products
        WHERE seller_id = ?
          AND status = 'active'
      `).bind(user.id).first();

    const orders =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE seller_id = ?
      `).bind(user.id).first();

    const sales =
      await env.DB.prepare(`
        SELECT
          COALESCE(SUM(total_price), 0) AS total
        FROM orders
        WHERE seller_id = ?
          AND payment_status = 'paid'
      `).bind(user.id).first();

    return json({
      ok: true,
      stats: {
        products: Number(
          products?.count || 0
        ),
        active_products: Number(
          activeProducts?.count || 0
        ),
        orders: Number(
          orders?.count || 0
        ),
        paid_sales: Number(
          sales?.total || 0
        )
      }
    });
  }

  // ==================================================
  // ADMIN STATS
  // ==================================================

  if (
    path === "/api/admin/stats" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const users =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM users
      `).first();

    const sellers =
      await env.DB.prepare(`
        SELECT COUNT(DISTINCT seller_id) AS count
        FROM products
      `).first();

    const products =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM products
      `).first();

    const services =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM products
        WHERE category = 'Services'
      `).first();

    const orders =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM orders
      `).first();

    const pendingOrders =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE status = 'pending'
      `).first();

    const paid =
      await env.DB.prepare(`
        SELECT
          COALESCE(
            SUM(total_price),
            0
          ) AS total
        FROM orders
        WHERE payment_status = 'paid'
      `).first();

    const commission =
      Number(paid?.total || 0) *
      COMMISSION_RATE;

    const categories =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM categories
        WHERE is_active = 1
      `).first();

    const messages =
      await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM messages
      `).first();

    return json({
      ok: true,
      stats: {
        users: Number(
          users?.count || 0
        ),

        sellers: Number(
          sellers?.count || 0
        ),

        products: Number(
          products?.count || 0
        ),

        services: Number(
          services?.count || 0
        ),

        orders: Number(
          orders?.count || 0
        ),

        pending_orders: Number(
          pendingOrders?.count || 0
        ),

        paid_amount: Number(
          paid?.total || 0
        ),

        commission_rate:
          COMMISSION_RATE,

        estimated_commission:
          commission,

        categories: Number(
          categories?.count || 0
        ),

        messages: Number(
          messages?.count || 0
        )
      }
    });
  }

  // ==================================================
  // ADMIN USERS
  // ==================================================

  if (
    path === "/api/admin/users" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const result = await env.DB.prepare(`
      SELECT
        id,
        name,
        email,
        role,
        phone,
        country,
        district,
        is_verified,
        is_active,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    return json({
      ok: true,
      users: result.results || []
    });
  }

  // ==================================================
  // ADMIN SELLERS
  // ==================================================

  if (
    path === "/api/admin/sellers" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const result = await env.DB.prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.country,
        u.district,
        u.is_verified,
        u.is_active,
        u.created_at,
        COUNT(DISTINCT p.id) AS product_count,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(
          SUM(
            CASE
              WHEN o.payment_status = 'paid'
              THEN o.total_price
              ELSE 0
            END
          ),
          0
        ) AS paid_sales
      FROM users u
      LEFT JOIN products p
        ON p.seller_id = u.id
      LEFT JOIN orders o
        ON o.seller_id = u.id
      WHERE EXISTS (
        SELECT 1
        FROM products px
        WHERE px.seller_id = u.id
      )
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    return json({
      ok: true,
      sellers: result.results || []
    });
  }

  // ==================================================
  // ADMIN PRODUCTS
  // ==================================================

  if (
    path === "/api/admin/products" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const result = await env.DB.prepare(`
      SELECT
        p.*,
        u.name AS seller_name,
        u.email AS seller_email
      FROM products p
      JOIN users u
        ON u.id = p.seller_id
      ORDER BY p.created_at DESC
    `).all();

    return json({
      ok: true,
      products: result.results || []
    });
  }

  // ==================================================
  // ADMIN ORDERS
  // ==================================================

  if (
    path === "/api/admin/orders" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const result = await env.DB.prepare(`
      SELECT
        o.*,
        p.title AS product_title,
        b.name AS buyer_name,
        b.email AS buyer_email,
        s.name AS seller_name,
        s.email AS seller_email
      FROM orders o
      JOIN products p
        ON p.id = o.product_id
      JOIN users b
        ON b.id = o.buyer_id
      LEFT JOIN users s
        ON s.id = o.seller_id
      ORDER BY o.created_at DESC
    `).all();

    return json({
      ok: true,
      orders: result.results || []
    });
  }

  // ==================================================
  // ADMIN PAYMENTS
  // ==================================================

  if (
    path === "/api/admin/payments" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const result = await env.DB.prepare(`
      SELECT
        o.id AS order_id,
        o.total_price,
        o.currency,
        o.payment_status,
        o.status,
        o.created_at,
        p.title AS product_title,
        b.name AS buyer_name,
        b.email AS buyer_email,
        s.name AS seller_name,
        s.email AS seller_email
      FROM orders o
      JOIN products p
        ON p.id = o.product_id
      JOIN users b
        ON b.id = o.buyer_id
      LEFT JOIN users s
        ON s.id = o.seller_id
      ORDER BY o.created_at DESC
    `).all();

    const rows = result.results || [];

    const paidAmount = rows
      .filter(x => x.payment_status === "paid")
      .reduce(
        (sum, x) =>
          sum + Number(x.total_price || 0),
        0
      );

    return json({
      ok: true,
      payments: rows,
      summary: {
        paid_amount: paidAmount,
        commission_rate: COMMISSION_RATE,
        estimated_commission:
          paidAmount * COMMISSION_RATE
      }
    });
  }

  // ==================================================
  // ADMIN SERVICES
  // ==================================================

  if (
    path === "/api/admin/services" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const result = await env.DB.prepare(`
      SELECT
        p.*,
        u.name AS seller_name,
        u.email AS seller_email
      FROM products p
      JOIN users u
        ON u.id = p.seller_id
      WHERE p.category = 'Services'
      ORDER BY p.created_at DESC
    `).all();

    return json({
      ok: true,
      services: result.results || []
    });
  }

  // ==================================================
  // ADMIN REPORTS
  // ==================================================

  if (
    path === "/api/admin/reports" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const countries =
      await env.DB.prepare(`
        SELECT
          country,
          COUNT(*) AS users
        FROM users
        GROUP BY country
        ORDER BY users DESC
      `).all();

    const productCategories =
      await env.DB.prepare(`
        SELECT
          category,
          COUNT(*) AS products
        FROM products
        GROUP BY category
        ORDER BY products DESC
      `).all();

    const orderStatuses =
      await env.DB.prepare(`
        SELECT
          status,
          COUNT(*) AS orders
        FROM orders
        GROUP BY status
        ORDER BY orders DESC
      `).all();

    const paymentStatuses =
      await env.DB.prepare(`
        SELECT
          payment_status,
          COUNT(*) AS payments,
          COALESCE(
            SUM(total_price),
            0
          ) AS amount
        FROM orders
        GROUP BY payment_status
        ORDER BY payments DESC
      `).all();

    const topProducts =
      await env.DB.prepare(`
        SELECT
          p.id,
          p.title,
          p.category,
          p.views,
          COUNT(o.id) AS order_count,
          COALESCE(
            SUM(o.total_price),
            0
          ) AS sales
        FROM products p
        LEFT JOIN orders o
          ON o.product_id = p.id
        GROUP BY p.id
        ORDER BY sales DESC, p.views DESC
        LIMIT 20
      `).all();

    return json({
      ok: true,
      reports: {
        users_by_country:
          countries.results || [],

        products_by_category:
          productCategories.results || [],

        orders_by_status:
          orderStatuses.results || [],

        payments:
          paymentStatuses.results || [],

        top_products:
          topProducts.results || []
      }
    });
  }

  // ==================================================
  // ADMIN REVIEWS
  // ==================================================
  // Reviews are not yet stored because the locked
  // schema has no reviews table.
  // This endpoint safely informs the frontend.

  if (
    path === "/api/admin/reviews" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    return json({
      ok: true,
      reviews: [],
      supported: false,
      message:
        "Reviews require a reviews table in schema.sql"
    });
  }

  // ==================================================
  // ADMIN PROMOTIONS / ADS
  // ==================================================
  // Promotions/Ads are not stored because the locked
  // schema has no promotions or ads tables.

  if (
    path === "/api/admin/promotions" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    return json({
      ok: true,
      promotions: [],
      supported: false,
      message:
        "Promotions require a promotions table in schema.sql"
    });
  }

  if (
    path === "/api/admin/ads" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    return json({
      ok: true,
      ads: [],
      supported: false,
      message:
        "Advertising requires an ads table in schema.sql"
    });
  }

  // ==================================================
  // ADMIN CATEGORIES
  // ==================================================

  if (
    path === "/api/admin/categories" &&
    method === "GET"
  ) {
    await requireAdmin(request, env);

    const result = await env.DB.prepare(`
      SELECT *
      FROM categories
      ORDER BY id
    `).all();

    return json({
      ok: true,
      categories: result.results || []
    });
  }

  if (
    path === "/api/admin/categories" &&
    method === "POST"
  ) {
    await requireAdmin(request, env);

    const body = await readJSON(request);

    const name = String(
      body.name || ""
    ).trim();

    const description = String(
      body.description || ""
    ).trim();

    const icon = String(
      body.icon || ""
    ).trim();

    if (!name) {
      return json({
        ok: false,
        error: "Category name is required"
      }, 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO categories
      (
        name,
        description,
        icon
      )
      VALUES (?, ?, ?)
    `).bind(
      name,
      description || null,
      icon || null
    ).run();

    return json({
      ok: true,
      categoryId:
        result.meta?.last_row_id
    }, 201);
  }

  // ==================================================
  // ADMIN ORDER STATUS
  // ==================================================

  const adminOrderMatch =
    path.match(
      /^\/api\/admin\/orders\/(\d+)$/
    );

  if (
    adminOrderMatch &&
    method === "PATCH"
  ) {
    await requireAdmin(request, env);

    const id =
      Number(adminOrderMatch[1]);

    const body =
      await readJSON(request);

    const status = String(
      body.status ||
      "pending"
    );

    const paymentStatus = String(
      body.payment_status ??
      body.paymentStatus ??
      "unpaid"
    );

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "completed"
    ];

    const allowedPayments = [
      "unpaid",
      "paid",
      "failed",
      "refunded"
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return json({
        ok: false,
        error: "Invalid order status"
      }, 400);
    }

    if (
      !allowedPayments.includes(
        paymentStatus
      )
    ) {
      return json({
        ok: false,
        error: "Invalid payment status"
      }, 400);
    }

    const result = await env.DB.prepare(`
      UPDATE orders
      SET
        status = ?,
        payment_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      status,
      paymentStatus,
      id
    ).run();

    if (!result.meta?.changes) {
      return json({
        ok: false,
        error: "Order not found"
      }, 404);
    }

    return json({
      ok: true,
      message: "Order updated"
    });
  }

  // ==================================================
  // ADMIN USER STATUS
  // ==================================================

  const adminUserMatch =
    path.match(
      /^\/api\/admin\/users\/(\d+)$/
    );

  if (
    adminUserMatch &&
    method === "PATCH"
  ) {
    const admin =
      await requireAdmin(
        request,
        env
      );

    const id =
      Number(adminUserMatch[1]);

    const body =
      await readJSON(request);

    if (id === admin.id) {
      return json({
        ok: false,
        error:
          "You cannot deactivate your own admin account"
      }, 400);
    }

    const user =
      await env.DB.prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `).bind(id).first();

    if (!user) {
      return json({
        ok: false,
        error: "User not found"
      }, 404);
    }

    const isActive =
      body.is_active === undefined
        ? user.is_active
        : (
          body.is_active
            ? 1
            : 0
        );

    const isVerified =
      body.is_verified === undefined
        ? user.is_verified
        : (
          body.is_verified
            ? 1
            : 0
        );

    const role =
      String(
        body.role ??
        user.role
      );

    const allowedRoles = [
      "buyer",
      "seller",
      "admin"
    ];

    if (
      !allowedRoles.includes(role)
    ) {
      return json({
        ok: false,
        error: "Invalid role"
      }, 400);
    }

    await env.DB.prepare(`
      UPDATE users
      SET
        role = ?,
        is_active = ?,
        is_verified = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      role,
      isActive,
      isVerified,
      id
    ).run();

    return json({
      ok: true,
      message: "User updated"
    });
  }

  // ==================================================
  // ADMIN PRODUCT STATUS
  // ==================================================

  const adminProductMatch =
    path.match(
      /^\/api\/admin\/products\/(\d+)$/
    );

  if (
    adminProductMatch &&
    method === "PATCH"
  ) {
    await requireAdmin(request, env);

    const id =
      Number(adminProductMatch[1]);

    const body =
      await readJSON(request);

    const product =
      await env.DB.prepare(`
        SELECT id, status
        FROM products
        WHERE id = ?
      `).bind(id).first();

    if (!product) {
      return json({
        ok: false,
        error: "Product not found"
      }, 404);
    }

    const status = String(
      body.status ??
      product.status
    );

    const allowed = [
      "active",
      "inactive",
      "sold",
      "pending",
      "rejected"
    ];

    if (!allowed.includes(status)) {
      return json({
        ok: false,
        error: "Invalid product status"
      }, 400);
    }

    await env.DB.prepare(`
      UPDATE products
      SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      status,
      id
    ).run();

    return json({
      ok: true,
      message: "Product status updated"
    });
  }

  // ==================================================
  // STATIC FRONTEND
  // ==================================================

  if (env.ASSETS) {
    return env.ASSETS.fetch(request);
  }

  return json({
    ok: false,
    error: "Route not found"
  }, 404);

} catch (error) {
  console.error(
    "IsokoHub API error:",
    error
  );

  if (
    error.message ===
    "UNAUTHORIZED"
  ) {
    return json({
      ok: false,
      error: "Please login first"
    }, 401);
  }

  if (
    error.message ===
    "ADMIN_ONLY"
  ) {
    return json({
      ok: false,
      error: "Admin access required"
    }, 403);
  }

  return json({
    ok: false,
    error:
      error.message ||
      "Server error"
  }, 500);
}

}
};
