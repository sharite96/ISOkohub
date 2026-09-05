const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS }
  });

const body = async (request) => {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return await request.json();
  return {};
};

const authToken = (request) => {
  const h = request.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
};

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function requireUser(env, request) {
  const token = authToken(request);
  if (!token) return null;
  const hash = await sha256(token);
  return await env.DB.prepare(
    "SELECT id,email,name,role FROM users WHERE session_token_hash=? AND status='active' LIMIT 1"
  ).bind(hash).first();
}

function cleanUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

async function requireAdmin(env, request) {
  const u = await requireUser(env, request);
  return u && u.role === "admin" ? u : null;
}

function slugId() {
  return crypto.randomUUID();
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  const path = "/" + (params.path || []).join("/");

  try {
    if (path === "/api/health") {
      let db = false;
      try { await env.DB.prepare("SELECT 1").first(); db = true; } catch {}
      return json({ ok: true, service: "IsokoHub API", database: db, images: !!env.IMAGES });
    }

    if (path === "/api/categories" && request.method === "GET") {
      return json({
        categories: [
          "Electronics","Fashion","Home","Education","Teachers & Tutors",
          "Art & Creative","Film & Entertainment","Photography & Video",
          "Technology & Digital","Professional Services","Delivery"
        ]
      });
    }

    if (path === "/api/config" && request.method === "GET") {
      return json({
        ok: true,
        features: {
          auth: true, products: true, services: true, orders: true,
          messages: true, reviews: true, notifications: true,
          uploads: !!env.IMAGES, payments: !!env.PAYMENT_PROVIDER_URL
        }
      });
    }

    // ---------------- AUTH ----------------
    if (path === "/api/auth/register" && request.method === "POST") {
      const b = await body(request);
      if (!b.email || !b.password || !b.name || String(b.password).length < 8)
        return json({ error: "Name, email and a password of at least 8 characters are required." }, 400);

      const email = String(b.email).trim().toLowerCase();
      const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
      if (exists) return json({ error: "Email already registered." }, 409);

      const id = slugId();
      const passwordHash = await sha256(String(b.password) + ":" + (env.AUTH_PEPPER || "change-this-secret"));
      await env.DB.prepare(
        "INSERT INTO users (id,email,name,password_hash,role,status,created_at) VALUES (?,?,?,?,'buyer','active',datetime('now'))"
      ).bind(id, email, String(b.name).trim(), passwordHash).run();

      const token = crypto.randomUUID() + crypto.randomUUID();
      const tokenHash = await sha256(token);
      await env.DB.prepare("UPDATE users SET session_token_hash=? WHERE id=?").bind(tokenHash, id).run();
      const u = await env.DB.prepare("SELECT id,email,name,role FROM users WHERE id=?").bind(id).first();

      return json({ ok: true, token, user: cleanUser(u) }, 201);
    }

    if (path === "/api/auth/login" && request.method === "POST") {
      const b = await body(request);
      const email = String(b.email || "").trim().toLowerCase();
      const passwordHash = await sha256(String(b.password || "") + ":" + (env.AUTH_PEPPER || "change-this-secret"));
      const u = await env.DB.prepare(
        "SELECT id,email,name,role FROM users WHERE email=? AND password_hash=? AND status='active' LIMIT 1"
      ).bind(email, passwordHash).first();
      if (!u) return json({ error: "Invalid email or password." }, 401);

      const token = crypto.randomUUID() + crypto.randomUUID();
      const tokenHash = await sha256(token);
      await env.DB.prepare("UPDATE users SET session_token_hash=? WHERE id=?").bind(tokenHash, u.id).run();
      return json({ ok: true, token, user: cleanUser(u) });
    }

    if (path === "/api/auth/me" && request.method === "GET") {
      const u = await requireUser(env, request);
      return u ? json({ user: cleanUser(u) }) : json({ user: null }, 401);
    }

    // ---------------- PRODUCTS ----------------
    if (path === "/api/products" && request.method === "GET") {
      const url = new URL(request.url);
      const q = (url.searchParams.get("q") || "").trim();
      const category = (url.searchParams.get("category") || "").trim();

      let sql = "SELECT * FROM products WHERE status='approved'";
      const args = [];
      if (q) { sql += " AND (title LIKE ? OR description LIKE ? OR category LIKE ?)"; const x = `%${q}%`; args.push(x,x,x); }
      if (category) { sql += " AND category=?"; args.push(category); }
      sql += " ORDER BY created_at DESC LIMIT 100";
      const result = await env.DB.prepare(sql).bind(...args).all();
      return json({ products: result.results || [] });
    }

    if (path === "/api/products" && request.method === "POST") {
      const u = await requireUser(env, request);
      if (!u) return json({ error: "Login required." }, 401);
      const b = await body(request);
      if (!b.title || !b.category || b.price == null) return json({ error: "Title, category and price are required." }, 400);
      const id = slugId();
      await env.DB.prepare(
        `INSERT INTO products
        (id,seller_id,title,description,category,price,currency,location,brand,condition,model,storage,ram,negotiable,status,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',datetime('now'))`
      ).bind(
        id,u.id,String(b.title),String(b.description||""),String(b.category),Number(b.price),
        String(b.currency||"RWF"),String(b.location||""),String(b.brand||""),String(b.condition||""),
        String(b.model||""),String(b.storage||""),String(b.ram||""),b.negotiable?1:0
      ).run();
      return json({ ok:true, id, status:"pending" }, 201);
    }

    if (path.match(/^\/api\/products\/[^/]+$/) && request.method === "DELETE") {
      const u = await requireUser(env, request);
      if (!u) return json({ error:"Login required." },401);
      const id = path.split("/").pop();
      const p = await env.DB.prepare("SELECT seller_id FROM products WHERE id=?").bind(id).first();
      if (!p || (p.seller_id !== u.id && u.role !== "admin")) return json({error:"Not allowed."},403);
      await env.DB.prepare("DELETE FROM products WHERE id=?").bind(id).run();
      return json({ok:true});
    }

    // ---------------- SERVICES ----------------
    if (path === "/api/services" && request.method === "GET") {
      const url = new URL(request.url);
      const q = (url.searchParams.get("q") || "").trim();
      const category = (url.searchParams.get("category") || "").trim();
      let sql = "SELECT * FROM services WHERE status='approved'";
      const args = [];
      if (q) { sql += " AND (name LIKE ? OR skill LIKE ? OR description LIKE ? OR category LIKE ?)"; const x=`%${q}%`; args.push(x,x,x,x); }
      if (category) { sql += " AND category=?"; args.push(category); }
      sql += " ORDER BY created_at DESC LIMIT 100";
      const result = await env.DB.prepare(sql).bind(...args).all();
      return json({services: result.results || []});
    }

    if (path === "/api/services" && request.method === "POST") {
      const u = await requireUser(env, request);
      if (!u) return json({error:"Login required."},401);
      const b = await body(request);
      if (!b.name || !b.category || b.price == null) return json({error:"Name, category and price are required."},400);
      const id = slugId();
      await env.DB.prepare(
        `INSERT INTO services
        (id,provider_id,name,description,category,skill,price,currency,location,availability,status,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?, 'pending',datetime('now'))`
      ).bind(
        id,u.id,String(b.name),String(b.description||""),String(b.category),String(b.skill||""),
        Number(b.price),String(b.currency||"RWF"),String(b.location||""),String(b.availability||"Online")
      ).run();
      return json({ok:true,id,status:"pending"},201);
    }

    // ---------------- ORDERS ----------------
    if (path === "/api/orders" && request.method === "POST") {
      const u = await requireUser(env, request);
      if (!u) return json({error:"Login required."},401);
      const b = await body(request);
      if (!Array.isArray(b.items) || !b.items.length) return json({error:"Order items are required."},400);

      const orderId = slugId();
      let total = 0;
      for (const item of b.items) {
        const p = await env.DB.prepare("SELECT id,seller_id,price FROM products WHERE id=? AND status='approved'").bind(item.product_id).first();
        if (!p) return json({error:`Product ${item.product_id} not found.`},404);
        total += Number(p.price) * Math.max(1, Number(item.quantity || 1));
      }
      await env.DB.prepare(
        "INSERT INTO orders (id,buyer_id,total,currency,status,payment_status,delivery_status,created_at) VALUES (?,?,?,?, 'pending','unpaid','pending',datetime('now'))"
      ).bind(orderId,u.id,total,String(b.currency||"RWF")).run();

      for (const item of b.items) {
        const p = await env.DB.prepare("SELECT id,seller_id,price FROM products WHERE id=?").bind(item.product_id).first();
        const qty = Math.max(1, Number(item.quantity || 1));
        await env.DB.prepare(
          "INSERT INTO order_items (id,order_id,product_id,seller_id,quantity,unit_price) VALUES (?,?,?,?,?,?)"
        ).bind(slugId(),orderId,p.id,p.seller_id,qty,p.price).run();
      }
      return json({ok:true,order_id:orderId,total,currency:String(b.currency||"RWF"),payment_status:"unpaid"},201);
    }

    if (path === "/api/orders" && request.method === "GET") {
      const u = await requireUser(env, request);
      if (!u) return json({error:"Login required."},401);
      const result = await env.DB.prepare(
        "SELECT * FROM orders WHERE buyer_id=? ORDER BY created_at DESC LIMIT 100"
      ).bind(u.id).all();
      return json({orders:result.results||[]});
    }

    // ---------------- MESSAGES ----------------
    if (path === "/api/messages" && request.method === "POST") {
      const u = await requireUser(env, request);
      if (!u) return json({error:"Login required."},401);
      const b = await body(request);
      if (!b.receiver_id || !b.body) return json({error:"Receiver and message are required."},400);
      const id=slugId();
      await env.DB.prepare(
        "INSERT INTO messages (id,sender_id,receiver_id,body,created_at) VALUES (?,?,?,?,datetime('now'))"
      ).bind(id,u.id,String(b.receiver_id),String(b.body)).run();
      return json({ok:true,id},201);
    }

    if (path === "/api/messages" && request.method === "GET") {
      const u = await requireUser(env, request);
      if (!u) return json({error:"Login required."},401);
      const result = await env.DB.prepare(
        "SELECT * FROM messages WHERE sender_id=? OR receiver_id=? ORDER BY created_at DESC LIMIT 200"
      ).bind(u.id,u.id).all();
      return json({messages:result.results||[]});
    }

    // ---------------- REVIEWS ----------------
    if (path === "/api/reviews" && request.method === "POST") {
      const u = await requireUser(env, request);
      if (!u) return json({error:"Login required."},401);
      const b = await body(request);
      const rating = Number(b.rating);
      if (!b.product_id && !b.service_id) return json({error:"Product or service is required."},400);
      if (rating < 1 || rating > 5) return json({error:"Rating must be 1-5."},400);
      const id=slugId();
      await env.DB.prepare(
        "INSERT INTO reviews (id,reviewer_id,product_id,service_id,rating,comment,status,created_at) VALUES (?,?,?,?,?,?,'published',datetime('now'))"
      ).bind(id,u.id,b.product_id||null,b.service_id||null,rating,String(b.comment||"")).run();
      return json({ok:true,id},201);
    }

    // ---------------- IMAGE UPLOAD (R2) ----------------
    if (path === "/api/upload" && request.method === "POST") {
      const u = await requireUser(env, request);
      if (!u) return json({error:"Login required."},401);
      if (!env.IMAGES) return json({error:"R2 image storage is not configured yet."},503);
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file.arrayBuffer !== "function") return json({error:"Image file is required."},400);
      const ext = (file.name || "upload").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,8) || "bin";
      const key = `uploads/${u.id}/${crypto.randomUUID()}.${ext}`;
      await env.IMAGES.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" }
      });
      return json({ok:true,key,public_url:`/api/images/${encodeURIComponent(key)}`},201);
    }

    if (path.startsWith("/api/images/") && request.method === "GET") {
      if (!env.IMAGES) return json({error:"R2 not configured."},503);
      const key = decodeURIComponent(path.slice("/api/images/".length));
      const object = await env.IMAGES.get(key);
      if (!object) return json({error:"Image not found."},404);
      const headers = new Headers(CORS);
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      return new Response(object.body, {headers});
    }

    // ---------------- ADMIN ----------------
    if (path === "/api/admin/stats" && request.method === "GET") {
      const a = await requireAdmin(env, request);
      if (!a) return json({error:"Admin access required."},403);
      const tables = ["users","products","services","orders","messages","reviews"];
      const stats = {};
      for (const t of tables) stats[t] = (await env.DB.prepare(`SELECT COUNT(*) c FROM ${t}`).first()).c;
      return json({stats});
    }

    if (path === "/api/admin/approve" && request.method === "POST") {
      const a = await requireAdmin(env, request);
      if (!a) return json({error:"Admin access required."},403);
      const b = await body(request);
      const table = b.type === "service" ? "services" : "products";
      if (!b.id) return json({error:"ID required."},400);
      await env.DB.prepare(`UPDATE ${table} SET status='approved' WHERE id=?`).bind(b.id).run();
      return json({ok:true});
    }

    return json({error:"API route not found",path},404);
  } catch (e) {
    console.error(e);
    return json({error:"Internal server error"},500);
  }
}
