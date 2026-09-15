const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      // =========================
      // HEALTH
      // =========================
      if (path === "/api/health" && method === "GET") {
        let database = "not_connected";

        if (env.DB) {
          try {
            await env.DB.prepare("SELECT 1").first();
            database = "connected";
          } catch {
            database = "error";
          }
        }

        return json({
          ok: true,
          service: "IsokoHub API",
          database,
          time: new Date().toISOString()
        });
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
        });
      }

      requireDB(env);

      // =========================
      // CATEGORIES
      // =========================
      if (path === "/api/categories" && method === "GET") {
        const result = await env.DB.prepare(`
          SELECT *
          FROM categories
          ORDER BY name ASC
        `).all();

        return json({
          ok: true,
          categories: result.results || []
        });
      }

      // =========================
      // PRODUCTS
      // =========================
      if (path === "/api/products" && method === "GET") {
        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";
        const country = url.searchParams.get("country") || "";

        let limit = Number(url.searchParams.get("limit") || 50);
        if (!Number.isFinite(limit)) limit = 50;
        limit = Math.min(Math.max(Math.floor(limit), 1), 100);

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
              OR p.brand LIKE ?
            )
          `;

          const q = `%${search}%`;
          params.push(q, q, q, q);
        }

        if (category) {
          query += ` AND p.category = ?`;
          params.push(category);
        }

        if (country) {
          query += ` AND u.country = ?`;
          params.push(country);
        }

        query += `
          ORDER BY p.created_at DESC
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
        });
      }

      // =========================
      // SINGLE PRODUCT
      // =========================
      const productMatch = path.match(/^\/api\/products\/([^/]+)$/);

      if (productMatch && method === "GET") {
        const id = productMatch[1];

        const product = await env.DB.prepare(`
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.country AS seller_country,
            u.district AS seller_district
          FROM products p
          LEFT JOIN users u ON u.id = p.seller_id
          WHERE p.id = ?
          LIMIT 1
        `).bind(id).first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404);
        }

        const images = await env.DB.prepare(`
          SELECT *
          FROM product_images
          WHERE product_id = ?
          ORDER BY created_at ASC
        `).bind(id).all();

        return json({
          ok: true,
          product,
          images: images.results || []
        });
      }

      // =========================
      // REGISTER
      // =========================
      if (path === "/api/register" && method === "POST") {
        const body = await readJSON(request);

        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const country = String(body.country || "Rwanda").trim();
        const district = String(body.district || "").trim();

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

        const id = crypto.randomUUID();
        const passwordHash = await sha256(password);

        await env.DB.prepare(`
          INSERT INTO users (
            id,
            email,
            name,
            role,
            password_hash,
            country,
            district
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          email,
          name,
          "buyer",
          passwordHash,
          country,
          district || null
        ).run();

        return json({
          ok: true,
          message: "Account created successfully",
          userId: id
        }, 201);
      }

      // =========================
      // LOGIN
      // =========================
      if (path === "/api/login" && method === "POST") {
        const body = await readJSON(request);

        const email = String(body.email || "").trim().toLowerCase();
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
          LIMIT 1
        `).bind(email).first();

        if (!user || !user.password_hash) {
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

        const token = crypto.randomUUID();
        const tokenHash = await sha256(token);

        await env.DB.prepare(`
          INSERT INTO sessions (
            id,
            user_id,
            token_hash,
            expires_at
          )
          VALUES (?, ?, ?, datetime('now', '+30 days'))
        `).bind(
          crypto.randomUUID(),
          user.id,
          tokenHash
        ).run();

        return json({
          ok: true,
          message: "Login successful",
          token,
          user: safeUser(user)
        });
      }

      // =========================
      // ME
      // =========================
      if (path === "/api/me" && method === "GET") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            authenticated: false,
            error: "Authentication required"
          }, 401);
        }

        return json({
          ok: true,
          authenticated: true,
          user: safeUser(user)
        });
      }

      // =========================
      // LOGOUT
      // =========================
      if (path === "/api/logout" && method === "POST") {
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
        });
      }

      // =========================
      // CREATE PRODUCT
      // =========================
      if (path === "/api/products" && method === "POST") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const body = await readJSON(request);

        const title = String(body.title || "").trim();
        const category = String(body.category || "").trim();
        const description = String(body.description || "").trim();
        const price = Number(body.price);

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

        const id = crypto.randomUUID();

        await env.DB.prepare(`
          INSERT INTO products (
            id,
            seller_id,
            title,
            description,
            category,
            price,
            currency,
            location,
            brand,
            condition,
            storage,
            ram,
            negotiable,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          user.id,
          title,
          description || null,
          category,
          Math.round(price),
          String(body.currency || "RWF"),
          body.location || null,
          body.brand || null,
          body.condition || null,
          body.storage || null,
          body.ram || null,
          body.negotiable ? 1 : 0,
          "active"
        ).run();

        return json({
          ok: true,
          message: "Product created successfully",
          productId: id
        }, 201);
      }

      // =========================
      // UPDATE PRODUCT
      // =========================
      if (productMatch && method === "PUT") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const id = productMatch[1];

        const product = await env.DB.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
          LIMIT 1
        `).bind(id).first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404);
        }

        if (product.seller_id !== user.id && user.role !== "admin") {
          return json({
            ok: false,
            error: "Not authorized"
          }, 403);
        }

        const body = await readJSON(request);

        await env.DB.prepare(`
          UPDATE products
          SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            category = COALESCE(?, category),
            price = COALESCE(?, price),
            currency = COALESCE(?, currency),
            location = COALESCE(?, location),
            brand = COALESCE(?, brand),
            condition = COALESCE(?, condition),
            storage = COALESCE(?, storage),
            ram = COALESCE(?, ram),
            negotiable = COALESCE(?, negotiable),
            status = COALESCE(?, status)
          WHERE id = ?
        `).bind(
          body.title ?? null,
          body.description ?? null,
          body.category ?? null,
          body.price !== undefined ? Number(body.price) : null,
          body.currency ?? null,
          body.location ?? null,
          body.brand ?? null,
          body.condition ?? null,
          body.storage ?? null,
          body.ram ?? null,
          body.negotiable === undefined
            ? null
            : (body.negotiable ? 1 : 0),
          body.status ?? null,
          id
        ).run();

        return json({
          ok: true,
          message: "Product updated successfully"
        });
      }

      // =========================
      // DELETE PRODUCT
      // =========================
      if (productMatch && method === "DELETE") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const id = productMatch[1];

        const product = await env.DB.prepare(`
          SELECT seller_id
          FROM products
          WHERE id = ?
          LIMIT 1
        `).bind(id).first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404);
        }

        if (product.seller_id !== user.id && user.role !== "admin") {
          return json({
            ok: false,
            error: "Not authorized"
          }, 403);
        }

        await env.DB.prepare(`
          DELETE FROM products
          WHERE id = ?
        `).bind(id).run();

        return json({
          ok: true,
          message: "Product deleted successfully"
        });
      }

      // =========================
      // SERVICES
      // =========================
      if (path === "/api/services" && method === "GET") {
        const result = await env.DB.prepare(`
          SELECT
            s.*,
            u.name AS provider_name,
            u.email AS provider_email
          FROM services s
          LEFT JOIN users u ON u.id = s.provider_id
          WHERE s.status = 'active'
          ORDER BY s.created_at DESC
        `).all();

        return json({
          ok: true,
          services: result.results || []
        });
      }

      if (path === "/api/services" && method === "POST") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const body = await readJSON(request);

        const name = String(body.name || "").trim();
        const category = String(body.category || "").trim();

        if (!name || !category) {
          return json({
            ok: false,
            error: "Service name and category are required"
          }, 400);
        }

        const id = crypto.randomUUID();

        await env.DB.prepare(`
          INSERT INTO services (
            id,
            provider_id,
            name,
            category,
            skill,
            description,
            price,
            currency,
            location,
            availability,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          user.id,
          name,
          category,
          body.skill || null,
          body.description || null,
          body.price !== undefined ? Number(body.price) : null,
          body.currency || "RWF",
          body.location || null,
          body.availability || null,
          "active"
        ).run();

        return json({
          ok: true,
          message: "Service created successfully",
          serviceId: id
        }, 201);
      }

      // =========================
      // ORDERS
      // =========================
      if (path === "/api/orders" && method === "GET") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const result = await env.DB.prepare(`
          SELECT
            o.*,
            oi.id AS item_id,
            oi.product_id,
            oi.seller_id,
            oi.quantity,
            oi.unit_price,
            p.title AS product_title,
            p.location AS product_location
          FROM orders o
          LEFT JOIN order_items oi ON oi.order_id = o.id
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE o.buyer_id = ?
             OR oi.seller_id = ?
          ORDER BY o.created_at DESC
        `).bind(user.id, user.id).all();

        return json({
          ok: true,
          orders: result.results || []
        });
      }

      // =========================
      // CREATE ORDER
      // =========================
      if (path === "/api/orders" && method === "POST") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const body = await readJSON(request);

        const productId = String(
          body.product_id || body.productId || ""
        ).trim();

        const quantity = Math.max(
          Number(body.quantity || 1),
          1
        );

        if (!productId) {
          return json({
            ok: false,
            error: "Product ID is required"
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

        const total = Number(product.price) * quantity;
        const orderId = crypto.randomUUID();

        await env.DB.prepare(`
          INSERT INTO orders (
            id,
            buyer_id,
            total,
            currency,
            status,
            payment_status,
            delivery_status,
            delivery_address
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          orderId,
          user.id,
          total,
          product.currency || "RWF",
          "pending",
          "unpaid",
          "not_started",
          body.delivery_address ||
          body.deliveryAddress ||
          null
        ).run();

        await env.DB.prepare(`
          INSERT INTO order_items (
            id,
            order_id,
            product_id,
            seller_id,
            quantity,
            unit_price
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          orderId,
          product.id,
          product.seller_id,
          quantity,
          product.price
        ).run();

        return json({
          ok: true,
          message: "Order created successfully",
          orderId,
          total,
          currency: product.currency || "RWF"
        }, 201);
      }

      // =========================
      // MESSAGES
      // =========================
      if (path === "/api/messages" && method === "GET") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const result = await env.DB.prepare(`
          SELECT
            m.*,
            s.name AS sender_name,
            r.name AS recipient_name
          FROM messages m
          JOIN users s ON s.id = m.sender_id
          JOIN users r ON r.id = m.recipient_id
          WHERE m.sender_id = ?
             OR m.recipient_id = ?
          ORDER BY m.created_at DESC
        `).bind(user.id, user.id).all();

        return json({
          ok: true,
          messages: result.results || []
        });
      }

      if (path === "/api/messages" && method === "POST") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const body = await readJSON(request);

        const recipientId = String(
          body.recipient_id ||
          body.recipientId ||
          ""
        ).trim();

        const messageBody = String(
          body.body ||
          body.message ||
          ""
        ).trim();

        if (!recipientId || !messageBody) {
          return json({
            ok: false,
            error: "Recipient and message are required"
          }, 400);
        }

        const recipient = await env.DB.prepare(`
          SELECT id
          FROM users
          WHERE id = ?
          LIMIT 1
        `).bind(recipientId).first();

        if (!recipient) {
          return json({
            ok: false,
            error: "Recipient not found"
          }, 404);
        }

        const id = crypto.randomUUID();

        await env.DB.prepare(`
          INSERT INTO messages (
            id,
            sender_id,
            recipient_id,
            body
          )
          VALUES (?, ?, ?, ?)
        `).bind(
          id,
          user.id,
          recipientId,
          messageBody
        ).run();

        return json({
          ok: true,
          message: "Message sent",
          messageId: id
        }, 201);
      }

      // =========================
      // REVIEWS
      // =========================
      if (path === "/api/reviews" && method === "POST") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const body = await readJSON(request);
        const rating = Number(body.rating);

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          return json({
            ok: false,
            error: "Rating must be between 1 and 5"
          }, 400);
        }

        const productId = body.product_id || null;
        const serviceId = body.service_id || null;

        if (!productId && !serviceId) {
          return json({
            ok: false,
            error: "Product ID or service ID is required"
          }, 400);
        }

        const id = crypto.randomUUID();

        await env.DB.prepare(`
          INSERT INTO reviews (
            id,
            reviewer_id,
            product_id,
            service_id,
            rating,
            body
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          user.id,
          productId,
          serviceId,
          rating,
          body.body || null
        ).run();

        return json({
          ok: true,
          message: "Review submitted",
          reviewId: id
        }, 201);
      }

      // =========================
      // NOTIFICATIONS
      // =========================
      if (path === "/api/notifications" && method === "GET") {
        const user = await authenticate(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Authentication required"
          }, 401);
        }

        const result = await env.DB.prepare(`
          SELECT *
          FROM notifications
          WHERE user_id = ?
          ORDER BY created_at DESC
        `).bind(user.id).all();

        return json({
          ok: true,
          notifications: result.results || []
        });
      }

      // =========================
      // UNKNOWN API
      // =========================
      if (path.startsWith("/api/")) {
        return json({
          ok: false,
          error: "API endpoint not found",
          path
        }, 404);
      }

      // =========================
      // STATIC FRONTEND
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
      }, 500);
    }
  }
};


// =========================
// DATABASE
// =========================

function requireDB(env) {
  if (!env.DB) {
    throw new Error("D1 database is not connected");
  }
}


// =========================
// JSON
// =========================

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        ...CORS
      }
    }
  );
}


async function readJSON(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}


// =========================
// SHA256
// =========================

async function sha256(value) {
  const data = new TextEncoder().encode(String(value));

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hash))
    .map(byte =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}


// =========================
// TOKEN
// =========================

function getToken(request) {
  const header =
    request.headers.get("Authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim() || null;
}


// =========================
// AUTHENTICATION
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
    country: user.country,
    district: user.district,
    created_at: user.created_at
  };
}
