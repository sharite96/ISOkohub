export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=UTF-8"
    };

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // =========================
      // HEALTH
      // =========================
      if (path === "/api/health" && method === "GET") {
        let database = "not_connected";

        try {
          if (env.DB) {
            await env.DB.prepare("SELECT 1").first();
            database = "connected";
          }
        } catch {
          database = "error";
        }

        return json({
          ok: true,
          service: "IsokoHub API",
          database,
          time: new Date().toISOString()
        }, 200, corsHeaders);
      }

      // =========================
      // CONFIG
      // =========================
      if (path === "/api/config" && method === "GET") {
        return json({
          ok: true,
          app: "IsokoHub",
          mode: "production",
          backend: "cloudflare-workers",
          database: env.DB ? "D1" : "none",
          assets: env.ASSETS ? "connected" : "none"
        }, 200, corsHeaders);
      }

      // =========================
      // CATEGORIES
      // =========================
      if (path === "/api/categories" && method === "GET") {
        requireDB(env);

        const result = await env.DB.prepare(`
          SELECT *
          FROM categories
          WHERE is_active = 1
          ORDER BY name ASC
        `).all();

        return json({
          ok: true,
          categories: result.results || []
        }, 200, corsHeaders);
      }

      // =========================
      // PRODUCTS - GET
      // =========================
      if (path === "/api/products" && method === "GET") {
        requireDB(env);

        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";
        const country = url.searchParams.get("country") || "";
        const limit = Math.min(
          Math.max(Number(url.searchParams.get("limit") || 50), 1),
          100
        );

        let query = `
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email
          FROM products p
          LEFT JOIN users u ON u.id = p.seller_id
          WHERE p.status = 'active'
        `;

        const params = [];

        if (search) {
          query += `
            AND (
              p.title LIKE ?
              OR p.description LIKE ?
              OR p.category LIKE ?
              OR u.name LIKE ?
            )
          `;

          const value = `%${search}%`;
          params.push(value, value, value, value);
        }

        if (category) {
          query += ` AND p.category = ?`;
          params.push(category);
        }

        if (country) {
          query += ` AND p.country = ?`;
          params.push(country);
        }

        query += `
          ORDER BY p.id DESC
          LIMIT ?
        `;

        params.push(limit);

        const result = await env.DB
          .prepare(query)
          .bind(...params)
          .all();

        return json({
          ok: true,
          products: result.results || []
        }, 200, corsHeaders);
      }

      // =========================
      // PRODUCT - SINGLE
      // =========================
      const productMatch = path.match(/^\/api\/products\/(\d+)$/);

      if (productMatch && method === "GET") {
        requireDB(env);

        const id = productMatch[1];

        const product = await env.DB.prepare(`
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.phone AS seller_phone
          FROM products p
          LEFT JOIN users u ON u.id = p.seller_id
          WHERE p.id = ?
          LIMIT 1
        `).bind(id).first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404, corsHeaders);
        }

        await env.DB.prepare(`
          UPDATE products
          SET views = views + 1
          WHERE id = ?
        `).bind(id).run();

        return json({
          ok: true,
          product
        }, 200, corsHeaders);
      }

      // =========================
      // REGISTER
      // =========================
      if (path === "/api/register" && method === "POST") {
        requireDB(env);

        const body = await request.json();

        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const phone = String(body.phone || "").trim();
        const country = String(body.country || "Rwanda").trim();
        const district = String(body.district || "").trim();

        if (!name || !email || !password) {
          return json({
            ok: false,
            error: "Name, email and password are required"
          }, 400, corsHeaders);
        }

        if (password.length < 6) {
          return json({
            ok: false,
            error: "Password must contain at least 6 characters"
          }, 400, corsHeaders);
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
          }, 409, corsHeaders);
        }

        const passwordHash = await sha256(password);

        const result = await env.DB.prepare(`
          INSERT INTO users
          (name, email, password_hash, phone, country, district)
          VALUES (?, ?, ?, ?, ?, ?)
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
          message: "Account created successfully",
          userId: result.meta?.last_row_id || null
        }, 201, corsHeaders);
      }

      // =========================
      // LOGIN
      // =========================
      if (path === "/api/login" && method === "POST") {
        requireDB(env);

        const body = await request.json();

        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!email || !password) {
          return json({
            ok: false,
            error: "Email and password are required"
          }, 400, corsHeaders);
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
          }, 401, corsHeaders);
        }

        const passwordHash = await sha256(password);

        if (user.password_hash !== passwordHash) {
          return json({
            ok: false,
            error: "Invalid email or password"
          }, 401, corsHeaders);
        }

        const token = crypto.randomUUID();
        const tokenHash = await sha256(token);

        await env.DB.prepare(`
          DELETE FROM sessions
          WHERE user_id = ?
        `).bind(user.id).run();

        await env.DB.prepare(`
          INSERT INTO sessions
          (user_id, token_hash, expires_at)
          VALUES (?, ?, datetime('now', '+30 days'))
        `).bind(
          user.id,
          tokenHash
        ).run();

        return json({
          ok: true,
          message: "Login successful",
          token,
          user: safeUser(user)
        }, 200, corsHeaders);
      }

      // =========================
      // ME
      // =========================
      if (path === "/api/me" && method === "GET") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            authenticated: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        return json({
          ok: true,
          authenticated: true,
          user: safeUser(user)
        }, 200, corsHeaders);
      }

      // =========================
      // LOGOUT
      // =========================
      if (path === "/api/logout" && method === "POST") {
        requireDB(env);

        const token = getToken(request);

        if (token) {
          const tokenHash = await sha256(token);

          await env.DB.prepare(`
            DELETE FROM sessions
            WHERE token_hash = ?
          `).bind(tokenHash).run();
        }

        return json({
          ok: true,
          message: "Logged out successfully"
        }, 200, corsHeaders);
      }

      // =========================
      // CREATE PRODUCT
      // =========================
      if (path === "/api/products" && method === "POST") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const body = await request.json();

        const title = String(body.title || "").trim();
        const category = String(body.category || "").trim();
        const description = String(body.description || "").trim();
        const price = Number(body.price || 0);
        const stock = Number(body.stock || 1);

        if (!title || !category) {
          return json({
            ok: false,
            error: "Title and category are required"
          }, 400, corsHeaders);
        }

        if (!Number.isFinite(price) || price < 0) {
          return json({
            ok: false,
            error: "Invalid price"
          }, 400, corsHeaders);
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id,
          title,
          category,
          description || null,
          price,
          String(body.currency || "RWF"),
          Number.isFinite(stock) && stock >= 0 ? stock : 1,
          body.brand || null,
          body.model || null,
          body.condition || null,
          body.country || user.country || "Rwanda",
          body.district || user.district || null,
          body.storage || null,
          body.ram || null,
          body.image_url || body.imageUrl || null,
          body.specs || null,
          body.negotiable ? 1 : 0,
          "active"
        ).run();

        return json({
          ok: true,
          message: "Product created successfully",
          productId: result.meta?.last_row_id || null
        }, 201, corsHeaders);
      }

      // =========================
      // UPDATE PRODUCT
      // =========================
      if (productMatch && method === "PUT") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const id = productMatch[1];

        const product = await env.DB.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).bind(id).first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404, corsHeaders);
        }

        if (product.seller_id !== user.id && user.role !== "admin") {
          return json({
            ok: false,
            error: "Not authorized"
          }, 403, corsHeaders);
        }

        const body = await request.json();

        await env.DB.prepare(`
          UPDATE products
          SET
            title = COALESCE(?, title),
            category = COALESCE(?, category),
            description = COALESCE(?, description),
            price = COALESCE(?, price),
            stock = COALESCE(?, stock),
            brand = COALESCE(?, brand),
            model = COALESCE(?, model),
            condition = COALESCE(?, condition),
            country = COALESCE(?, country),
            district = COALESCE(?, district),
            storage = COALESCE(?, storage),
            ram = COALESCE(?, ram),
            image_url = COALESCE(?, image_url),
            specs = COALESCE(?, specs),
            negotiable = COALESCE(?, negotiable),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          body.title ?? null,
          body.category ?? null,
          body.description ?? null,
          body.price ?? null,
          body.stock ?? null,
          body.brand ?? null,
          body.model ?? null,
          body.condition ?? null,
          body.country ?? null,
          body.district ?? null,
          body.storage ?? null,
          body.ram ?? null,
          body.image_url ?? body.imageUrl ?? null,
          body.specs ?? null,
          body.negotiable === undefined
            ? null
            : (body.negotiable ? 1 : 0),
          id
        ).run();

        return json({
          ok: true,
          message: "Product updated successfully"
        }, 200, corsHeaders);
      }

      // =========================
      // DELETE PRODUCT
      // =========================
      if (productMatch && method === "DELETE") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const id = productMatch[1];

        const product = await env.DB.prepare(`
          SELECT seller_id
          FROM products
          WHERE id = ?
        `).bind(id).first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404, corsHeaders);
        }

        if (product.seller_id !== user.id && user.role !== "admin") {
          return json({
            ok: false,
            error: "Not authorized"
          }, 403, corsHeaders);
        }

        await env.DB.prepare(`
          DELETE FROM products
          WHERE id = ?
        `).bind(id).run();

        return json({
          ok: true,
          message: "Product deleted successfully"
        }, 200, corsHeaders);
      }

      // =========================
      // SAVED PRODUCTS - GET
      // =========================
      if (path === "/api/saved" && method === "GET") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const result = await env.DB.prepare(`
          SELECT
            p.*,
            s.created_at AS saved_at
          FROM saved_products s
          JOIN products p ON p.id = s.product_id
          WHERE s.user_id = ?
          ORDER BY s.id DESC
        `).bind(user.id).all();

        return json({
          ok: true,
          products: result.results || []
        }, 200, corsHeaders);
      }

      // =========================
      // SAVE PRODUCT
      // =========================
      if (path === "/api/saved" && method === "POST") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const body = await request.json();
        const productId = Number(body.product_id || body.productId);

        if (!productId) {
          return json({
            ok: false,
            error: "Product ID is required"
          }, 400, corsHeaders);
        }

        await env.DB.prepare(`
          INSERT OR IGNORE INTO saved_products
          (user_id, product_id)
          VALUES (?, ?)
        `).bind(user.id, productId).run();

        return json({
          ok: true,
          message: "Product saved"
        }, 200, corsHeaders);
      }

      // =========================
      // REMOVE SAVED PRODUCT
      // =========================
      if (path.startsWith("/api/saved/") && method === "DELETE") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const id = path.split("/").pop();

        await env.DB.prepare(`
          DELETE FROM saved_products
          WHERE user_id = ?
          AND product_id = ?
        `).bind(user.id, id).run();

        return json({
          ok: true,
          message: "Product removed from saved"
        }, 200, corsHeaders);
      }

      // =========================
      // MESSAGES - GET
      // =========================
      if (path === "/api/messages" && method === "GET") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const result = await env.DB.prepare(`
          SELECT
            m.*,
            s.name AS sender_name,
            r.name AS receiver_name
          FROM messages m
          JOIN users s ON s.id = m.sender_id
          JOIN users r ON r.id = m.receiver_id
          WHERE m.sender_id = ?
             OR m.receiver_id = ?
          ORDER BY m.id DESC
        `).bind(user.id, user.id).all();

        return json({
          ok: true,
          messages: result.results || []
        }, 200, corsHeaders);
      }

      // =========================
      // SEND MESSAGE
      // =========================
      if (path === "/api/messages" && method === "POST") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const body = await request.json();

        const receiverId = Number(
          body.receiver_id || body.receiverId
        );

        const message = String(body.message || "").trim();

        if (!receiverId || !message) {
          return json({
            ok: false,
            error: "Receiver and message are required"
          }, 400, corsHeaders);
        }

        const result = await env.DB.prepare(`
          INSERT INTO messages
          (sender_id, receiver_id, product_id, message)
          VALUES (?, ?, ?, ?)
        `).bind(
          user.id,
          receiverId,
          body.product_id || body.productId || null,
          message
        ).run();

        return json({
          ok: true,
          message: "Message sent",
          messageId: result.meta?.last_row_id || null
        }, 201, corsHeaders);
      }

      // =========================
      // ORDERS - GET
      // =========================
      if (path === "/api/orders" && method === "GET") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const result = await env.DB.prepare(`
          SELECT
            o.*,
            p.title AS product_title,
            p.image_url AS product_image,
            b.name AS buyer_name,
            s.name AS seller_name
          FROM orders o
          JOIN products p ON p.id = o.product_id
          JOIN users b ON b.id = o.buyer_id
          LEFT JOIN users s ON s.id = o.seller_id
          WHERE o.buyer_id = ?
             OR o.seller_id = ?
          ORDER BY o.id DESC
        `).bind(user.id, user.id).all();

        return json({
          ok: true,
          orders: result.results || []
        }, 200, corsHeaders);
      }

      // =========================
      // CREATE ORDER
      // =========================
      if (path === "/api/orders" && method === "POST") {
        requireDB(env);

        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401, corsHeaders);
        }

        const body = await request.json();

        const productId = Number(
          body.product_id || body.productId
        );

        const quantity = Math.max(
          Number(body.quantity || 1),
          1
        );

        if (!productId) {
          return json({
            ok: false,
            error: "Product ID is required"
          }, 400, corsHeaders);
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
          }, 404, corsHeaders);
        }

        if (product.stock < quantity) {
          return json({
            ok: false,
            error: "Not enough stock"
          }, 400, corsHeaders);
        }

        const total = Number(product.price) * quantity;

        const result = await env.DB.prepare(`
          INSERT INTO orders (
            buyer_id,
            product_id,
            seller_id,
            quantity,
            unit_price,
            total_price,
            currency,
            delivery_address,
            delivery_country,
            delivery_district,
            delivery_phone
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id,
          product.id,
          product.seller_id,
          quantity,
          product.price,
          total,
          product.currency || "RWF",
          body.delivery_address || body.deliveryAddress || null,
          body.delivery_country || body.deliveryCountry || user.country || null,
          body.delivery_district || body.deliveryDistrict || user.district || null,
          body.delivery_phone || body.deliveryPhone || user.phone || null
        ).run();

        await env.DB.prepare(`
          UPDATE products
          SET stock = stock - ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(quantity, product.id).run();

        return json({
          ok: true,
          message: "Order created successfully",
          orderId: result.meta?.last_row_id || null,
          total
        }, 201, corsHeaders);
      }

      // =========================
      // API NOT FOUND
      // =========================
      if (path.startsWith("/api/")) {
        return json({
          ok: false,
          error: "API endpoint not found",
          path
        }, 404, corsHeaders);
      }

      // =========================
      // FRONTEND
      // =========================
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response("IsokoHub", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      });

    } catch (error) {
      return json({
        ok: false,
        error: "Server error",
        message: error?.message || String(error)
      }, 500, corsHeaders);
    }
  }
};


// =========================
// DATABASE CHECK
// =========================
function requireDB(env) {
  if (!env.DB) {
    throw new Error("D1 database is not connected");
  }
}


// =========================
// JSON
// =========================
function json(data, status = 200, extraHeaders = {}) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        ...extraHeaders
      }
    }
  );
}


// =========================
// SHA-256
// =========================
async function sha256(value) {
  const data = new TextEncoder().encode(String(value));

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}


// =========================
// GET BEARER TOKEN
// =========================
function getToken(request) {
  const header = request.headers.get("Authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim() || null;
}


// =========================
// AUTHENTICATE USER
// =========================
async function authenticate(request, env) {
  const token = getToken(request);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256(token);

  const user = await env.DB.prepare(`
    SELECT u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.expires_at > datetime('now')
      AND u.is_active = 1
    LIMIT 1
  `).bind(tokenHash).first();

  return user || null;
}


// =========================
// SAFE USER
// =========================
function safeUser(user) {
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
    is_active: user.is_active,
    created_at: user.created_at
  };
}
