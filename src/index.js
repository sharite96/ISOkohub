export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: cors
      });

    const body = async () => {
      try {
        return await request.json();
      } catch {
        return {};
      }
    };

    try {
      // =========================
      // HEALTH
      // =========================
      if (path === "/api/health" && request.method === "GET") {
        let db = false;

        try {
          await env.DB.prepare("SELECT 1").first();
          db = true;
        } catch {}

        return json({
          ok: true,
          service: "IsokoHub API",
          database: db ? "connected" : "error",
          time: new Date().toISOString()
        });
      }

      // =========================
      // CONFIG
      // =========================
      if (path === "/api/config" && request.method === "GET") {
        return json({
          ok: true,
          app: "IsokoHub",
          currency: "RWF",
          database: "D1",
          payments: false
        });
      }

      // =========================
      // CATEGORIES
      // =========================
      if (path === "/api/categories" && request.method === "GET") {
        const result = await env.DB
          .prepare(`
            SELECT id, name, description, icon
            FROM categories
            WHERE is_active = 1
            ORDER BY id ASC
          `)
          .all();

        return json({
          ok: true,
          categories: result.results || []
        });
      }

      // =========================
      // PRODUCTS - GET
      // =========================
      if (path === "/api/products" && request.method === "GET") {
        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";

        let sql = `
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.phone AS seller_phone
          FROM products p
          LEFT JOIN users u ON u.id = p.seller_id
          WHERE p.status = 'active'
        `;

        const params = [];

        if (search) {
          sql += `
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
          sql += ` AND p.category = ?`;
          params.push(category);
        }

        sql += ` ORDER BY p.created_at DESC`;

        const result = await env.DB
          .prepare(sql)
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
      if (
        path.startsWith("/api/products/") &&
        request.method === "GET"
      ) {
        const id = path.split("/").pop();

        const product = await env.DB
          .prepare(`
            SELECT
              p.*,
              u.name AS seller_name,
              u.email AS seller_email,
              u.phone AS seller_phone,
              u.country AS seller_country,
              u.district AS seller_district
            FROM products p
            LEFT JOIN users u ON u.id = p.seller_id
            WHERE p.id = ?
          `)
          .bind(id)
          .first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404);
        }

        await env.DB
          .prepare(`
            UPDATE products
            SET views = views + 1
            WHERE id = ?
          `)
          .bind(id)
          .run();

        return json({
          ok: true,
          product
        });
      }

      // =========================
      // REGISTER
      // =========================
      if (path === "/api/register" && request.method === "POST") {
        const data = await body();

        const name = String(data.name || "").trim();
        const email = String(data.email || "").trim().toLowerCase();
        const password = String(data.password || "");
        const phone = String(data.phone || "").trim();
        const country = String(data.country || "Rwanda").trim();
        const district = String(data.district || "").trim();

        if (!name || !email || !password) {
          return json({
            ok: false,
            error: "Name, email and password are required"
          }, 400);
        }

        const existing = await env.DB
          .prepare("SELECT id FROM users WHERE email = ?")
          .bind(email)
          .first();

        if (existing) {
          return json({
            ok: false,
            error: "Email already exists"
          }, 409);
        }

        const passwordHash = await sha256(password);

        const result = await env.DB
          .prepare(`
            INSERT INTO users
            (name, email, password_hash, phone, country, district)
            VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(
            name,
            email,
            passwordHash,
            phone,
            country,
            district
          )
          .run();

        return json({
          ok: true,
          user: {
            id: result.meta.last_row_id,
            name,
            email,
            role: "buyer"
          }
        }, 201);
      }

      // =========================
      // LOGIN
      // =========================
      if (path === "/api/login" && request.method === "POST") {
        const data = await body();

        const email = String(data.email || "").trim().toLowerCase();
        const password = String(data.password || "");

        if (!email || !password) {
          return json({
            ok: false,
            error: "Email and password are required"
          }, 400);
        }

        const user = await env.DB
          .prepare(`
            SELECT *
            FROM users
            WHERE email = ?
            AND is_active = 1
          `)
          .bind(email)
          .first();

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

        const token = crypto.randomUUID() + "-" + crypto.randomUUID();
        const tokenHash = await sha256(token);

        const expires = new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 30
        ).toISOString();

        await env.DB
          .prepare(`
            INSERT INTO sessions
            (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
          `)
          .bind(user.id, tokenHash, expires)
          .run();

        delete user.password_hash;

        return json({
          ok: true,
          token,
          user
        });
      }

      // =========================
      // ME
      // =========================
      if (path === "/api/me" && request.method === "GET") {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Unauthorized"
          }, 401);
        }

        return json({
          ok: true,
          user
        });
      }

      // =========================
      // LOGOUT
      // =========================
      if (path === "/api/logout" && request.method === "POST") {
        const token = getToken(request);

        if (token) {
          const tokenHash = await sha256(token);

          await env.DB
            .prepare(`
              DELETE FROM sessions
              WHERE token_hash = ?
            `)
            .bind(tokenHash)
            .run();
        }

        return json({
          ok: true,
          message: "Logged out"
        });
      }

      // =========================
      // CREATE PRODUCT
      // =========================
      if (path === "/api/products" && request.method === "POST") {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Login required"
          }, 401);
        }

        const data = await body();

        const title = String(data.title || "").trim();
        const category = String(data.category || "").trim();
        const description = String(data.description || "").trim();

        const price = Number(data.price || 0);
        const stock = Number(data.stock || 1);

        if (!title || !category) {
          return json({
            ok: false,
            error: "Title and category are required"
          }, 400);
        }

        const result = await env.DB
          .prepare(`
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
              negotiable
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            user.id,
            title,
            category,
            description,
            price,
            data.currency || "RWF",
            stock,
            data.brand || null,
            data.model || null,
            data.condition || null,
            data.country || user.country || "Rwanda",
            data.district || user.district || null,
            data.storage || null,
            data.ram || null,
            data.image_url || null,
            data.specs || null,
            data.negotiable ? 1 : 0
          )
          .run();

        return json({
          ok: true,
          message: "Product created",
          product_id: result.meta.last_row_id
        }, 201);
      }

      // =========================
      // MY PRODUCTS
      // =========================
      if (path === "/api/my-products" && request.method === "GET") {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Login required"
          }, 401);
        }

        const result = await env.DB
          .prepare(`
            SELECT *
            FROM products
            WHERE seller_id = ?
            ORDER BY created_at DESC
          `)
          .bind(user.id)
          .all();

        return json({
          ok: true,
          products: result.results || []
        });
      }

      // =========================
      // SAVE PRODUCT
      // =========================
      if (
        path.startsWith("/api/saved/") &&
        request.method === "POST"
      ) {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Login required"
          }, 401);
        }

        const productId = path.split("/").pop();

        await env.DB
          .prepare(`
            INSERT OR IGNORE INTO saved_products
            (user_id, product_id)
            VALUES (?, ?)
          `)
          .bind(user.id, productId)
          .run();

        return json({
          ok: true,
          message: "Product saved"
        });
      }

      // =========================
      // SAVED PRODUCTS
      // =========================
      if (
        path === "/api/saved" &&
        request.method === "GET"
      ) {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Login required"
          }, 401);
        }

        const result = await env.DB
          .prepare(`
            SELECT p.*
            FROM saved_products s
            JOIN products p ON p.id = s.product_id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
          `)
          .bind(user.id)
          .all();

        return json({
          ok: true,
          products: result.results || []
        });
      }

      // =========================
      // CREATE ORDER
      // =========================
      if (
        path === "/api/orders" &&
        request.method === "POST"
      ) {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Login required"
          }, 401);
        }

        const data = await body();

        const productId = Number(data.product_id);
        const quantity = Number(data.quantity || 1);

        if (!productId || quantity < 1) {
          return json({
            ok: false,
            error: "Invalid product or quantity"
          }, 400);
        }

        const product = await env.DB
          .prepare(`
            SELECT *
            FROM products
            WHERE id = ?
            AND status = 'active'
          `)
          .bind(productId)
          .first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404);
        }

        if (product.stock < quantity) {
          return json({
            ok: false,
            error: "Not enough stock"
          }, 400);
        }

        const total = product.price * quantity;

        const result = await env.DB
          .prepare(`
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
          `)
          .bind(
            user.id,
            product.id,
            product.seller_id,
            quantity,
            product.price,
            total,
            product.currency || "RWF",
            data.delivery_address || null,
            data.delivery_country || user.country || "Rwanda",
            data.delivery_district || user.district || null,
            data.delivery_phone || user.phone || null
          )
          .run();

        await env.DB
          .prepare(`
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
          `)
          .bind(quantity, product.id)
          .run();

        return json({
          ok: true,
          order_id: result.meta.last_row_id,
          total_price: total
        }, 201);
      }

      // =========================
      // MY ORDERS
      // =========================
      if (
        path === "/api/orders" &&
        request.method === "GET"
      ) {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Login required"
          }, 401);
        }

        const result = await env.DB
          .prepare(`
            SELECT
              o.*,
              p.title AS product_title,
              p.image_url AS product_image,
              u.name AS seller_name
            FROM orders o
            LEFT JOIN products p ON p.id = o.product_id
            LEFT JOIN users u ON u.id = o.seller_id
            WHERE o.buyer_id = ?
            ORDER BY o.created_at DESC
          `)
          .bind(user.id)
          .all();

        return json({
          ok: true,
          orders: result.results || []
        });
      }

      // =========================
      // MESSAGES
      // =========================
      if (
        path === "/api/messages" &&
        request.method === "POST"
      ) {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Login required"
          }, 401);
        }

        const data = await body();

        if (!data.receiver_id || !data.message) {
          return json({
            ok: false,
            error: "Receiver and message are required"
          }, 400);
        }

        await env.DB
          .prepare(`
            INSERT INTO messages
            (sender_id, receiver_id, product_id, message)
            VALUES (?, ?, ?, ?)
          `)
          .bind(
            user.id,
            data.receiver_id,
            data.product_id || null,
            String(data.message)
          )
          .run();

        return json({
          ok: true,
          message: "Message sent"
        }, 201);
      }

      if (
        path === "/api/messages" &&
        request.method === "GET"
      ) {
        const user = await getUser(request, env);

        if (!user) {
          return json({
            ok: false,
            error: "Login required"
          }, 401);
        }

        const result = await env.DB
          .prepare(`
            SELECT
              m.*,
              s.name AS sender_name,
              r.name AS receiver_name,
              p.title AS product_title
            FROM messages m
            LEFT JOIN users s ON s.id = m.sender_id
            LEFT JOIN users r ON r.id = m.receiver_id
            LEFT JOIN products p ON p.id = m.product_id
            WHERE m.sender_id = ?
               OR m.receiver_id = ?
            ORDER BY m.created_at DESC
          `)
          .bind(user.id, user.id)
          .all();

        return json({
          ok: true,
          messages: result.results || []
        });
      }

      // =========================
      // ADMIN
      // =========================
      if (
        path === "/api/admin/stats" &&
        request.method === "GET"
      ) {
        const user = await getUser(request, env);

        if (!user || user.role !== "admin") {
          return json({
            ok: false,
            error: "Admin access required"
          }, 403);
        }

        const users = await env.DB
          .prepare("SELECT COUNT(*) AS count FROM users")
          .first();

        const products = await env.DB
          .prepare("SELECT COUNT(*) AS count FROM products")
          .first();

        const orders = await env.DB
          .prepare("SELECT COUNT(*) AS count FROM orders")
          .first();

        return json({
          ok: true,
          stats: {
            users: users?.count || 0,
            products: products?.count || 0,
            orders: orders?.count || 0
          }
        });
      }

      // =========================
      // ASSETS / FRONTEND
      // =========================
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return json({
        ok: false,
        error: "Route not found"
      }, 404);

    } catch (error) {
      return json({
        ok: false,
        error: error.message || "Internal server error"
      }, 500);
    }
  }
};


// =================================
// HELPERS
// =================================

function getToken(request) {
  const header = request.headers.get("Authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}


async function sha256(value) {
  const data = new TextEncoder().encode(value);

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}


async function getUser(request, env) {
  const token = getToken(request);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256(token);

  const user = await env.DB
    .prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.country,
        u.district,
        u.avatar_url,
        u.bio,
        u.is_verified,
        u.is_active
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.is_active = 1
    `)
    .bind(tokenHash)
    .first();

  return user || null;
}
