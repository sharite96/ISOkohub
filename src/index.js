export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // =========================
    // CORS
    // =========================
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
      // HEALTH CHECK
      // =========================
      if (path === "/api/health" && method === "GET") {
        let database = "not_connected";

        try {
          if (env.DB) {
            await env.DB.prepare("SELECT 1").first();
            database = "connected";
          }
        } catch (error) {
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
          database: env.DB ? "D1" : "none"
        }, 200, corsHeaders);
      }

      // =========================
      // CATEGORIES
      // =========================
      if (path === "/api/categories" && method === "GET") {
        if (!env.DB) {
          return json({
            ok: false,
            error: "D1 database is not connected"
          }, 500, corsHeaders);
        }

        const result = await env.DB.prepare(`
          SELECT *
          FROM categories
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
        if (!env.DB) {
          return json({
            ok: false,
            error: "D1 database is not connected"
          }, 500, corsHeaders);
        }

        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";
        const limit = Math.min(
          Number(url.searchParams.get("limit") || 50),
          100
        );

        let query = `
          SELECT *
          FROM products
          WHERE 1 = 1
        `;

        const params = [];

        if (search) {
          query += `
            AND (
              title LIKE ?
              OR description LIKE ?
              OR category LIKE ?
            )
          `;

          const value = `%${search}%`;
          params.push(value, value, value);
        }

        if (category) {
          query += ` AND category = ?`;
          params.push(category);
        }

        query += `
          ORDER BY id DESC
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
      const productMatch = path.match(/^\/api\/products\/([^/]+)$/);

      if (productMatch && method === "GET") {
        if (!env.DB) {
          return json({
            ok: false,
            error: "D1 database is not connected"
          }, 500, corsHeaders);
        }

        const id = productMatch[1];

        const product = await env.DB
          .prepare(`
            SELECT *
            FROM products
            WHERE id = ?
            LIMIT 1
          `)
          .bind(id)
          .first();

        if (!product) {
          return json({
            ok: false,
            error: "Product not found"
          }, 404, corsHeaders);
        }

        return json({
          ok: true,
          product
        }, 200, corsHeaders);
      }

      // =========================
      // REGISTER
      // =========================
      if (path === "/api/register" && method === "POST") {
        if (!env.DB) {
          return json({
            ok: false,
            error: "D1 database is not connected"
          }, 500, corsHeaders);
        }

        const body = await request.json();

        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!name || !email || !password) {
          return json({
            ok: false,
            error: "Name, email and password are required"
          }, 400, corsHeaders);
        }

        const existing = await env.DB
          .prepare(`
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
          `)
          .bind(email)
          .first();

        if (existing) {
          return json({
            ok: false,
            error: "Email already registered"
          }, 409, corsHeaders);
        }

        const passwordHash = await sha256(password);

        const result = await env.DB
          .prepare(`
            INSERT INTO users
            (name, email, password_hash, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `)
          .bind(name, email, passwordHash)
          .run();

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
        if (!env.DB) {
          return json({
            ok: false,
            error: "D1 database is not connected"
          }, 500, corsHeaders);
        }

        const body = await request.json();

        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!email || !password) {
          return json({
            ok: false,
            error: "Email and password are required"
          }, 400, corsHeaders);
        }

        const user = await env.DB
          .prepare(`
            SELECT *
            FROM users
            WHERE email = ?
            LIMIT 1
          `)
          .bind(email)
          .first();

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

        return json({
          ok: true,
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        }, 200, corsHeaders);
      }

      // =========================
      // ME
      // =========================
      if (path === "/api/me" && method === "GET") {
        return json({
          ok: false,
          authenticated: false,
          message: "Authentication session endpoint ready"
        }, 200, corsHeaders);
      }

      // =========================
      // LOGOUT
      // =========================
      if (path === "/api/logout" && method === "POST") {
        return json({
          ok: true,
          message: "Logged out successfully"
        }, 200, corsHeaders);
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
      // FRONTEND STATIC ASSETS
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
// JSON RESPONSE
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
  const data = new TextEncoder().encode(value);

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}
