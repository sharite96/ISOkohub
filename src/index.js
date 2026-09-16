const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

const COMMISSION_RATE = 0.05;

/* =========================================================
   ISOKOHUB GLOBAL CONFIGURATION
========================================================= */

const SERVICE_CATEGORIES = [
  "Business & Professional",
  "Engineering",
  "IT & Technology",
  "Construction & Property",
  "Education & Teachers",
  "Art & Creative",
  "Film & Entertainment",
  "Marketing & Communication",
  "Automotive & Transport",
  "Agriculture & Environment",
  "Home Services",
  "Legal & Finance",
  "Health & Wellness",
  "Beauty & Personal Care",
  "Food & Hospitality",
  "Events",
  "Logistics",
  "Travel & Tourism",
  "Industrial & Manufacturing",
  "Jobs & Freelance",
  "Services",
  "Other Services"
];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola",
  "Antigua and Barbuda","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh",
  "Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil",
  "Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde",
  "Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo",
  "Costa Rica","Cote d'Ivoire","Croatia","Cuba","Cyprus",
  "Czechia","Democratic Republic of the Congo","Denmark",
  "Djibouti","Dominica","Dominican Republic","Ecuador",
  "Egypt","El Salvador","Equatorial Guinea","Eritrea",
  "Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece",
  "Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan",
  "Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar",
  "Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands",
  "Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique",
  "Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea",
  "North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia",
  "Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Suriname",
  "Sweden","Switzerland","Syria","Tajikistan","Tanzania",
  "Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago",
  "Tunisia","Türkiye","Turkmenistan","Tuvalu","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const SERVICE_KEYWORDS = [
  "service","consultant","consulting","engineer","engineering",
  "developer","development","designer","design","teacher",
  "teaching","tutor","education","course","training",
  "photography","photographer","videography","video","film",
  "filmmaker","producer","marketing","lawyer","legal",
  "accountant","accounting","finance","doctor","health",
  "therapy","fitness","beauty","salon","barber","restaurant",
  "hotel","event","transport","driver","delivery","logistics",
  "travel","tourism","agriculture","construction","plumber",
  "plumbing","electrician","cleaning","mechanic","repair",
  "installation","branding","social media","tax","chef",
  "catering","shipping","warehouse","courier","factory",
  "machine","manufacturing","freelance","job","jobs",
  "software","website","app","mobile app"
];

const SERVICE_MAP = {
  "Business & Professional": [
    "business","consultant","consulting","management","professional"
  ],
  "Engineering": [
    "engineer","engineering"
  ],
  "IT & Technology": [
    "software","developer","development","website","app",
    "technology","programming","computer","it support"
  ],
  "Construction & Property": [
    "construction","builder","building","architect",
    "property","real estate"
  ],
  "Education & Teachers": [
    "teacher","teaching","tutor","education",
    "course","training","lesson"
  ],
  "Art & Creative": [
    "artist","art","design","designer","graphic",
    "creative","photography","photographer"
  ],
  "Film & Entertainment": [
    "film","filmmaker","producer","videography",
    "video","actor","entertainment"
  ],
  "Marketing & Communication": [
    "marketing","branding","advertising","social media",
    "communication","copywriter"
  ],
  "Automotive & Transport": [
    "car","automotive","mechanic","driver","transport","vehicle"
  ],
  "Agriculture & Environment": [
    "agriculture","farming","farmer","environment","gardening"
  ],
  "Home Services": [
    "plumber","plumbing","electrician","cleaning",
    "cleaner","home repair","installation"
  ],
  "Legal & Finance": [
    "lawyer","legal","accountant","accounting",
    "finance","tax","audit"
  ],
  "Health & Wellness": [
    "doctor","health","therapy","fitness","wellness"
  ],
  "Beauty & Personal Care": [
    "beauty","salon","barber","hair","makeup"
  ],
  "Food & Hospitality": [
    "restaurant","hotel","chef","catering","food","hospitality"
  ],
  "Events": [
    "event","events","wedding","party"
  ],
  "Logistics": [
    "logistics","delivery","shipping","warehouse","courier"
  ],
  "Travel & Tourism": [
    "travel","tourism","tour","hotel"
  ],
  "Industrial & Manufacturing": [
    "factory","machine","manufacturing","industrial"
  ],
  "Jobs & Freelance": [
    "job","jobs","freelance","freelancer"
  ],
  "Services": [
    "service","services"
  ],
  "Other Services": []
};


/* =========================================================
   HELPERS
========================================================= */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

async function readJSON(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function sha256(value) {
  const data = new TextEncoder().encode(String(value));
  const hash = await crypto.subtle.digest("SHA-256", data);

  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function limitValue(value, fallback = 100, max = 500) {
  const n = Math.floor(Number(value));

  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }

  return Math.min(n, max);
}

function tokenFromRequest(request) {
  const header = request.headers.get("Authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim() || null;
}

function requireDB(env) {
  if (!env || !env.DB) {
    throw new Error("D1 database binding DB is not configured.");
  }

  return env.DB;
}

function safeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    country: user.country,
    role: user.role,
    is_active: user.is_active,
    is_verified: user.is_verified,
    created_at: user.created_at
  };
}

function productText(product) {
  return [
    product.title,
    product.name,
    product.category,
    product.description,
    product.specs,
    product.type,
    product.brand,
    product.model
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isServiceProduct(product) {
  const category = normalize(product.category);

  if (
    SERVICE_CATEGORIES.some(
      c => normalize(c) === category
    )
  ) {
    return true;
  }

  const text = productText(product);

  return SERVICE_KEYWORDS.some(word =>
    text.includes(normalize(word))
  );
}

function serviceCategoryMatch(product, category) {
  if (!category) return true;

  const wanted = normalize(category);

  if (normalize(product.category) === wanted) {
    return true;
  }

  const matchedCategory =
    SERVICE_CATEGORIES.find(
      x => normalize(x) === wanted
    );

  const words =
    SERVICE_MAP[category] ||
    SERVICE_MAP[matchedCategory] ||
    [];

  const text = productText(product);

  return words.some(word =>
    text.includes(normalize(word))
  );
}

async function authenticate(env, request) {
  const db = requireDB(env);
  const token = tokenFromRequest(request);

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const tokenHash = await sha256(token);

  const row = await db.prepare(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.country,
      u.role,
      u.is_active,
      u.is_verified,
      u.created_at
    FROM sessions s
    JOIN users u
      ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.expires_at > datetime('now')
      AND u.is_active = 1
    LIMIT 1
  `)
    .bind(tokenHash)
    .first();

  if (!row) {
    throw new Error("UNAUTHORIZED");
  }

  return row;
}

async function requireUser(env, request) {
  return authenticate(env, request);
}

async function requireAdmin(env, request) {
  const user = await authenticate(env, request);

  if (String(user.role).toLowerCase() !== "admin") {
    throw new Error("ADMIN_ONLY");
  }

  return user;
}


/* =========================================================
   MAIN WORKER
========================================================= */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS
      });
    }

    const productMatch =
      path.match(/^\/api\/products\/(\d+)$/);

    try {

      /* =====================================================
         HEALTH
      ===================================================== */

      if (
        path === "/api/health" &&
        method === "GET"
      ) {
        let database = "not_connected";
        let ok = false;
        let error = null;

        try {
          requireDB(env);

          await env.DB
            .prepare("SELECT 1")
            .first();

          database = "connected";
          ok = true;
        } catch (e) {
          database = "error";
          error = e.message;
        }

        return json({
          ok,
          service: "IsokoHub API",
          database,
          time: new Date().toISOString(),
          ...(error ? { error } : {})
        }, ok ? 200 : 503);
      }


      /* =====================================================
         CONFIG
      ===================================================== */

      if (
        path === "/api/config" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          environment: "production",
          platform: "cloudflare-workers",
          database: "D1",
          assets: "ASSETS",
          marketplace: "global",
          countries: COUNTRIES.length,
          service_categories: SERVICE_CATEGORIES.length,
          commission_rate: COMMISSION_RATE
        });
      }

      const db = requireDB(env);


      /* =====================================================
         COUNTRIES
      ===================================================== */

      if (
        path === "/api/countries" &&
        method === "GET"
      ) {
        const q = normalize(
          url.searchParams.get("search")
        );

        const list = q
          ? COUNTRIES.filter(c =>
              normalize(c).includes(q)
            )
          : COUNTRIES;

        return json({
          ok: true,
          countries: list,
          count: list.length
        });
      }


      /* =====================================================
         SERVICE CATEGORIES
      ===================================================== */

      if (
        path === "/api/service-categories" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          categories: SERVICE_CATEGORIES,
          count: SERVICE_CATEGORIES.length
        });
      }


      /* =====================================================
         DATABASE CATEGORIES
      ===================================================== */

      if (
        path === "/api/categories" &&
        method === "GET"
      ) {
        const rows = await db.prepare(`
          SELECT *
          FROM categories
          WHERE is_active = 1
          ORDER BY name ASC
        `).all();

        return json({
          ok: true,
          categories: rows.results || []
        });
      }


      /* =====================================================
         PRODUCTS - GET
      ===================================================== */

      if (
        path === "/api/products" &&
        method === "GET"
      ) {
        const search =
          url.searchParams.get("search") || "";

        const category =
          url.searchParams.get("category") || "";

        const country =
          url.searchParams.get("country") || "";

        const limit =
          limitValue(
            url.searchParams.get("limit"),
            100,
            500
          );

        let sql = `
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.country AS seller_country
          FROM products p
          JOIN users u
            ON u.id = p.seller_id
          WHERE p.status = 'active'
            AND u.is_active = 1
        `;

        const binds = [];

        if (search) {
          sql += `
            AND (
              p.title LIKE ?
              OR p.description LIKE ?
              OR p.specs LIKE ?
              OR p.category LIKE ?
              OR p.brand LIKE ?
              OR p.model LIKE ?
              OR p.country LIKE ?
              OR p.district LIKE ?
            )
          `;

          const s = `%${search}%`;

          binds.push(
            s, s, s, s,
            s, s, s, s
          );
        }

        if (category) {
          sql += ` AND p.category LIKE ? `;
          binds.push(`%${category}%`);
        }

        if (country) {
          sql += ` AND p.country LIKE ? `;
          binds.push(`%${country}%`);
        }

        sql += `
          ORDER BY p.id DESC
          LIMIT ?
        `;

        binds.push(limit);

        const rows = await db
          .prepare(sql)
          .bind(...binds)
          .all();

        return json({
          ok: true,
          products: rows.results || [],
          count: (rows.results || []).length
        });
      }


      /* =====================================================
         SINGLE PRODUCT
      ===================================================== */

      if (
        productMatch &&
        method === "GET"
      ) {
        const id = Number(productMatch[1]);

        const row = await db.prepare(`
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.country AS seller_country
          FROM products p
          JOIN users u
            ON u.id = p.seller_id
          WHERE p.id = ?
          LIMIT 1
        `)
          .bind(id)
          .first();

        if (!row) {
          return json({
            error: "Product not found"
          }, 404);
        }

        try {
          await db.prepare(`
            UPDATE products
            SET views = COALESCE(views, 0) + 1
            WHERE id = ?
          `)
            .bind(id)
            .run();
        } catch {}

        return json({
          ok: true,
          product: row
        });
      }


      /* =====================================================
         SERVICES
      ===================================================== */

      if (
        path === "/api/services" &&
        method === "GET"
      ) {
        const search =
          url.searchParams.get("search") ||
          url.searchParams.get("q") ||
          "";

        const category =
          url.searchParams.get("category") || "";

        const country =
          url.searchParams.get("country") || "";

        const city =
          url.searchParams.get("city") ||
          url.searchParams.get("district") ||
          "";

        const provider =
          url.searchParams.get("provider") ||
          "";

        const online =
          normalize(
            url.searchParams.get("online")
          );

        const limit =
          limitValue(
            url.searchParams.get("limit"),
            100,
            500
          );

        let sql = `
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.country AS seller_country
          FROM products p
          JOIN users u
            ON u.id = p.seller_id
          WHERE p.status = 'active'
            AND u.is_active = 1
        `;

        const binds = [];

        if (country) {
          sql += ` AND p.country LIKE ? `;
          binds.push(`%${country}%`);
        }

        if (city) {
          sql += ` AND p.district LIKE ? `;
          binds.push(`%${city}%`);
        }

        if (provider) {
          sql += ` AND u.name LIKE ? `;
          binds.push(`%${provider}%`);
        }

        if (search) {
          sql += `
            AND (
              p.title LIKE ?
              OR p.description LIKE ?
              OR p.specs LIKE ?
              OR p.category LIKE ?
              OR p.brand LIKE ?
              OR p.model LIKE ?
            )
          `;

          const s = `%${search}%`;

          binds.push(
            s, s, s,
            s, s, s
          );
        }

        sql += `
          ORDER BY p.id DESC
          LIMIT 2000
        `;

        const rows = await db
          .prepare(sql)
          .bind(...binds)
          .all();

        let services =
          (rows.results || [])
            .filter(isServiceProduct)
            .filter(p =>
              serviceCategoryMatch(
                p,
                category
              )
            );

        if (
          online === "true" ||
          online === "1"
        ) {
          services = services.filter(p => {
            const text = productText(p);

            return (
              text.includes("online") ||
              text.includes("remote") ||
              text.includes("virtual")
            );
          });
        }

        services = services.slice(0, limit);

        return json({
          ok: true,
          services,
          count: services.length,
          global: true,
          countries: COUNTRIES.length
        });
      }


      /* =====================================================
         REGISTER
      ===================================================== */

      if (
        path === "/api/register" &&
        method === "POST"
      ) {
        const body = await readJSON(request);

        const name =
          String(body.name || "").trim();

        const email =
          normalize(body.email);

        const password =
          String(body.password || "");

        const country =
          String(
            body.country || "Rwanda"
          ).trim();

        if (!name) {
          return json({
            error: "Full name is required"
          }, 400);
        }

        if (!email) {
          return json({
            error: "Email is required"
          }, 400);
        }

        if (password.length < 6) {
          return json({
            error:
              "Password must contain at least 6 characters"
          }, 400);
        }

        const existing =
          await db.prepare(`
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
          `)
            .bind(email)
            .first();

        if (existing) {
          return json({
            error:
              "An account with this email already exists"
          }, 409);
        }

        const passwordHash =
          await sha256(password);

        const result =
          await db.prepare(`
            INSERT INTO users
              (
                name,
                email,
                password_hash,
                country,
                role,
                is_active,
                is_verified
              )
            VALUES
              (?, ?, ?, ?, 'buyer', 1, 0)
          `)
            .bind(
              name,
              email,
              passwordHash,
              country
            )
            .run();

        const userId =
          result.meta?.last_row_id;

        const user =
          await db.prepare(`
            SELECT
              id,
              name,
              email,
              country,
              role,
              is_active,
              is_verified,
              created_at
            FROM users
            WHERE id = ?
            LIMIT 1
          `)
            .bind(userId)
            .first();

        return json({
          ok: true,
          user: safeUser(user)
        }, 201);
      }


      /* =====================================================
         LOGIN
      ===================================================== */

      if (
        path === "/api/login" &&
        method === "POST"
      ) {
        const body = await readJSON(request);

        const email =
          normalize(body.email);

        const password =
          String(body.password || "");

        if (!email || !password) {
          return json({
            error:
              "Email and password are required"
          }, 400);
        }

        const user =
          await db.prepare(`
            SELECT *
            FROM users
            WHERE email = ?
              AND is_active = 1
            LIMIT 1
          `)
            .bind(email)
            .first();

        if (!user) {
          return json({
            error:
              "Invalid email or password"
          }, 401);
        }

        const passwordHash =
          await sha256(password);

        if (
          passwordHash !==
          user.password_hash
        ) {
          return json({
            error:
              "Invalid email or password"
          }, 401);
        }

        const token =
          `${crypto.randomUUID()}-${crypto.randomUUID()}`;

        const tokenHash =
          await sha256(token);

        await db.prepare(`
          INSERT INTO sessions
            (
              user_id,
              token_hash,
              expires_at
            )
          VALUES
            (
              ?,
              ?,
              datetime('now', '+30 days')
            )
        `)
          .bind(
            user.id,
            tokenHash
          )
          .run();

        return json({
          ok: true,
          token,
          user: safeUser(user)
        });
      }


      /* =====================================================
         ME
      ===================================================== */

      if (
        path === "/api/me" &&
        method === "GET"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        return json({
          ok: true,
          user: safeUser(user)
        });
      }


      /* =====================================================
         UPDATE ME
      ===================================================== */

      if (
        path === "/api/me" &&
        method === "PATCH"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const body =
          await readJSON(request);

        const name =
          body.name !== undefined
            ? String(body.name).trim()
            : user.name;

        const country =
          body.country !== undefined
            ? String(body.country).trim()
            : user.country;

        await db.prepare(`
          UPDATE users
          SET
            name = ?,
            country = ?
          WHERE id = ?
        `)
          .bind(
            name,
            country,
            user.id
          )
          .run();

        const updated =
          await db.prepare(`
            SELECT
              id,
              name,
              email,
              country,
              role,
              is_active,
              is_verified,
              created_at
            FROM users
            WHERE id = ?
          `)
            .bind(user.id)
            .first();

        return json({
          ok: true,
          user: safeUser(updated)
        });
      }


      /* =====================================================
         LOGOUT
      ===================================================== */

      if (
        path === "/api/logout" &&
        method === "POST"
      ) {
        const token =
          tokenFromRequest(request);

        if (token) {
          const hash =
            await sha256(token);

          await db.prepare(`
            DELETE FROM sessions
            WHERE token_hash = ?
          `)
            .bind(hash)
            .run();
        }

        return json({
          ok: true,
          message: "Logged out"
        });
      }


      /* =====================================================
         CREATE PRODUCT / SERVICE
      ===================================================== */

      if (
        path === "/api/products" &&
        method === "POST"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const body =
          await readJSON(request);

        const title =
          String(body.title || "").trim();

        const category =
          String(body.category || "").trim();

        const description =
          String(body.description || "").trim();

        const specs =
          String(body.specs || "").trim();

        const price =
          number(body.price, 0);

        const currency =
          String(
            body.currency || "RWF"
          ).trim();

        const stock =
          number(body.stock, 1);

        const condition =
          String(
            body.condition || "new"
          ).trim();

        const country =
          String(
            body.country ||
            user.country ||
            "Rwanda"
          ).trim();

        const district =
          String(
            body.district || ""
          ).trim();

        const brand =
          String(
            body.brand || ""
          ).trim();

        const model =
          String(
            body.model || ""
          ).trim();

        const storage =
          String(
            body.storage || ""
          ).trim();

        const ram =
          String(
            body.ram || ""
          ).trim();

        const image_url =
          String(
            body.image_url ||
            body.imageUrl ||
            ""
          ).trim();

        const negotiable =
          body.negotiable ? 1 : 0;

        const validConditions = [
          "new",
          "used",
          "has crack",
          "refurbished"
        ];

        if (!title) {
          return json({
            error: "Title is required"
          }, 400);
        }

        if (!category) {
          return json({
            error: "Category is required"
          }, 400);
        }

        if (price < 0) {
          return json({
            error:
              "Price cannot be negative"
          }, 400);
        }

        if (
          !validConditions.includes(
            normalize(condition)
          )
        ) {
          return json({
            error:
              "Invalid condition"
          }, 400);
        }

        const result =
          await db.prepare(`
            INSERT INTO products
              (
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
            VALUES
              (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, 'active'
              )
          `)
            .bind(
              user.id,
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
            .run();

        return json({
          ok: true,
          message:
            "Product/service published successfully",
          id:
            result.meta?.last_row_id
        }, 201);
      }


      /* =====================================================
         UPDATE PRODUCT
      ===================================================== */

      if (
        productMatch &&
        method === "PUT"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const id =
          Number(productMatch[1]);

        const existing =
          await db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
            LIMIT 1
          `)
            .bind(id)
            .first();

        if (!existing) {
          return json({
            error: "Product not found"
          }, 404);
        }

        if (
          Number(existing.seller_id) !==
            Number(user.id) &&
          String(user.role).toLowerCase() !== "admin"
        ) {
          return json({
            error: "Not allowed"
          }, 403);
        }

        const body =
          await readJSON(request);

        const title =
          body.title !== undefined
            ? String(body.title).trim()
            : existing.title;

        const category =
          body.category !== undefined
            ? String(body.category).trim()
            : existing.category;

        const description =
          body.description !== undefined
            ? String(body.description)
            : existing.description;

        const price =
          body.price !== undefined
            ? number(
                body.price,
                existing.price
              )
            : existing.price;

        const currency =
          body.currency !== undefined
            ? String(body.currency).trim()
            : existing.currency;

        const stock =
          body.stock !== undefined
            ? number(
                body.stock,
                existing.stock
              )
            : existing.stock;

        const brand =
          body.brand !== undefined
            ? String(body.brand)
            : existing.brand;

        const model =
          body.model !== undefined
            ? String(body.model)
            : existing.model;

        const condition =
          body.condition !== undefined
            ? String(body.condition)
            : existing.condition;

        const country =
          body.country !== undefined
            ? String(body.country)
            : existing.country;

        const district =
          body.district !== undefined
            ? String(body.district)
            : existing.district;

        const storage =
          body.storage !== undefined
            ? String(body.storage)
            : existing.storage;

        const ram =
          body.ram !== undefined
            ? String(body.ram)
            : existing.ram;

        const image_url =
          body.image_url !== undefined
            ? String(body.image_url)
            : existing.image_url;

        const specs =
          body.specs !== undefined
            ? String(body.specs)
            : existing.specs;

        const negotiable =
          body.negotiable !== undefined
            ? (body.negotiable ? 1 : 0)
            : existing.negotiable;

        const status =
          body.status !== undefined
            ? String(body.status)
            : existing.status;

        await db.prepare(`
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
            status = ?
          WHERE id = ?
        `)
          .bind(
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
            status,
            id
          )
          .run();

        return json({
          ok: true,
          message:
            "Product updated successfully"
        });
      }


      /* =====================================================
         DELETE PRODUCT
      ===================================================== */

      if (
        productMatch &&
        method === "DELETE"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const id =
          Number(productMatch[1]);

        const existing =
          await db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
          `)
            .bind(id)
            .first();

        if (!existing) {
          return json({
            error: "Product not found"
          }, 404);
        }

        if (
          Number(existing.seller_id) !==
            Number(user.id) &&
          String(user.role).toLowerCase() !== "admin"
        ) {
          return json({
            error: "Not allowed"
          }, 403);
        }

        await db.prepare(`
          UPDATE products
          SET status = 'inactive'
          WHERE id = ?
        `)
          .bind(id)
          .run();

        return json({
          ok: true,
          message:
            "Product removed successfully"
        });
      }


      /* =====================================================
         SAVED - GET
      ===================================================== */

      if (
        path === "/api/saved" &&
        method === "GET"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const rows =
          await db.prepare(`
            SELECT
              sp.*,
              p.*,
              u.name AS seller_name,
              u.country AS seller_country
            FROM saved_products sp
            JOIN products p
              ON p.id = sp.product_id
            JOIN users u
              ON u.id = p.seller_id
            WHERE sp.user_id = ?
            ORDER BY sp.id DESC
          `)
            .bind(user.id)
            .all();

        return json({
          ok: true,
          saved:
            rows.results || []
        });
      }


      /* =====================================================
         SAVED - POST
      ===================================================== */

      if (
        path === "/api/saved" &&
        method === "POST"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const body =
          await readJSON(request);

        const productId =
          number(
            body.product_id ||
            body.productId
          );

        if (!productId) {
          return json({
            error:
              "product_id is required"
          }, 400);
        }

        const product =
          await db.prepare(`
            SELECT id
            FROM products
            WHERE id = ?
          `)
            .bind(productId)
            .first();

        if (!product) {
          return json({
            error:
              "Product not found"
          }, 404);
        }

        const existing =
          await db.prepare(`
            SELECT id
            FROM saved_products
            WHERE user_id = ?
              AND product_id = ?
            LIMIT 1
          `)
            .bind(
              user.id,
              productId
            )
            .first();

        if (!existing) {
          await db.prepare(`
            INSERT INTO saved_products
              (user_id, product_id)
            VALUES
              (?, ?)
          `)
            .bind(
              user.id,
              productId
            )
            .run();
        }

        return json({
          ok: true,
          message: "Saved"
        }, 201);
      }


      /* =====================================================
         SAVED - DELETE
      ===================================================== */

      const savedMatch =
        path.match(
          /^\/api\/saved\/(\d+)$/
        );

      if (
        savedMatch &&
        method === "DELETE"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const productId =
          Number(savedMatch[1]);

        await db.prepare(`
          DELETE FROM saved_products
          WHERE user_id = ?
            AND product_id = ?
        `)
          .bind(
            user.id,
            productId
          )
          .run();

        return json({
          ok: true,
          message:
            "Removed from saved"
        });
      }


      /* =====================================================
         ORDERS - GET
         SCHEMA:
         id,buyer_id,product_id,seller_id,quantity,
         unit_price,total_price,currency,status,
         payment_status,delivery_*,created_at,updated_at
      ===================================================== */

      if (
        path === "/api/orders" &&
        method === "GET"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const rows =
          await db.prepare(`
            SELECT
              o.*,
              p.title AS product_title,
              buyer.name AS buyer_name,
              seller.name AS seller_name
            FROM orders o
            JOIN products p
              ON p.id = o.product_id
            JOIN users buyer
              ON buyer.id = o.buyer_id
            JOIN users seller
              ON seller.id = o.seller_id
            WHERE
              o.buyer_id = ?
              OR o.seller_id = ?
            ORDER BY o.id DESC
          `)
            .bind(
              user.id,
              user.id
            )
            .all();

        const orders =
          (rows.results || []).map(order => ({
            ...order,
            commission:
              number(order.total_price) *
              COMMISSION_RATE
          }));

        return json({
          ok: true,
          orders
        });
      }


      /* =====================================================
         CREATE ORDER
      ===================================================== */

      if (
        path === "/api/orders" &&
        method === "POST"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const body =
          await readJSON(request);

        const productId =
          number(
            body.product_id ||
            body.productId
          );

        const quantity =
          Math.max(
            1,
            Math.floor(
              number(
                body.quantity,
                1
              )
            )
          );

        const deliveryAddress =
          String(
            body.delivery_address ||
            body.deliveryAddress ||
            ""
          ).trim();

        const deliveryCountry =
          String(
            body.delivery_country ||
            body.deliveryCountry ||
            user.country ||
            ""
          ).trim();

        const deliveryDistrict =
          String(
            body.delivery_district ||
            body.deliveryDistrict ||
            ""
          ).trim();

        const deliveryPhone =
          String(
            body.delivery_phone ||
            body.deliveryPhone ||
            ""
          ).trim();

        if (!productId) {
          return json({
            error:
              "product_id is required"
          }, 400);
        }

        const product =
          await db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
              AND status = 'active'
            LIMIT 1
          `)
            .bind(productId)
            .first();

        if (!product) {
          return json({
            error:
              "Product is not available"
          }, 404);
        }

        if (
          Number(product.seller_id) ===
          Number(user.id)
        ) {
          return json({
            error:
              "You cannot order your own listing"
          }, 400);
        }

        if (
          Number(product.stock) <
          quantity
        ) {
          return json({
            error:
              "Not enough stock available"
          }, 400);
        }

        const unitPrice =
          number(product.price);

        const totalPrice =
          unitPrice * quantity;

        const currency =
          String(
            product.currency || "RWF"
          );

        /*
          Stock is reduced first.
          If order insertion fails,
          stock is restored.
        */
        const stockUpdate =
          await db.prepare(`
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
              AND status = 'active'
              AND stock >= ?
          `)
            .bind(
              quantity,
              productId,
              quantity
            )
            .run();

        if (
          !stockUpdate.success ||
          Number(
            stockUpdate.meta?.changes || 0
          ) < 1
        ) {
          return json({
            error:
              "Stock is no longer available"
          }, 409);
        }

        try {
          const result =
            await db.prepare(`
              INSERT INTO orders
                (
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
              VALUES
                (
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  'pending',
                  'unpaid',
                  ?,
                  ?,
                  ?,
                  ?
                )
            `)
              .bind(
                user.id,
                productId,
                product.seller_id,
                quantity,
                unitPrice,
                totalPrice,
                currency,
                deliveryAddress,
                deliveryCountry,
                deliveryDistrict,
                deliveryPhone
              )
              .run();

          return json({
            ok: true,
            message:
              "Order placed successfully",
            order_id:
              result.meta?.last_row_id,
            quantity,
            unit_price:
              unitPrice,
            total_price:
              totalPrice,
            commission:
              totalPrice * COMMISSION_RATE,
            currency
          }, 201);

        } catch (e) {

          await db.prepare(`
            UPDATE products
            SET stock = stock + ?
            WHERE id = ?
          `)
            .bind(
              quantity,
              productId
            )
            .run();

          throw e;
        }
      }


      /* =====================================================
         MESSAGES - GET
      ===================================================== */

      if (
        path === "/api/messages" &&
        method === "GET"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const rows =
          await db.prepare(`
            SELECT
              m.*,
              sender.name AS sender_name,
              receiver.name AS receiver_name
            FROM messages m
            JOIN users sender
              ON sender.id = m.sender_id
            JOIN users receiver
              ON receiver.id = m.receiver_id
            WHERE
              m.sender_id = ?
              OR m.receiver_id = ?
            ORDER BY m.id ASC
          `)
            .bind(
              user.id,
              user.id
            )
            .all();

        return json({
          ok: true,
          messages:
            rows.results || []
        });
      }


      /* =====================================================
         MESSAGES - POST
      ===================================================== */

      if (
        path === "/api/messages" &&
        method === "POST"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const body =
          await readJSON(request);

        const receiverId =
          number(
            body.receiver_id ||
            body.receiverId
          );

        const message =
          String(
            body.body ||
            body.message ||
            ""
          ).trim();

        if (!receiverId) {
          return json({
            error:
              "receiver_id is required"
          }, 400);
        }

        if (!message) {
          return json({
            error:
              "Message is required"
          }, 400);
        }

        if (
          receiverId ===
          Number(user.id)
        ) {
          return json({
            error:
              "You cannot message yourself"
          }, 400);
        }

        const receiver =
          await db.prepare(`
            SELECT id
            FROM users
            WHERE id = ?
              AND is_active = 1
          `)
            .bind(receiverId)
            .first();

        if (!receiver) {
          return json({
            error:
              "Recipient not found"
          }, 404);
        }

        const result =
          await db.prepare(`
            INSERT INTO messages
              (
                sender_id,
                receiver_id,
                body
              )
            VALUES
              (?, ?, ?)
          `)
            .bind(
              user.id,
              receiverId,
              message
            )
            .run();

        return json({
          ok: true,
          message:
            "Message sent",
          id:
            result.meta?.last_row_id
        }, 201);
      }


      /* =====================================================
         SELLER PRODUCTS
      ===================================================== */

      if (
        path === "/api/seller/products" &&
        method === "GET"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const rows =
          await db.prepare(`
            SELECT *
            FROM products
            WHERE seller_id = ?
            ORDER BY id DESC
          `)
            .bind(user.id)
            .all();

        return json({
          ok: true,
          products:
            rows.results || []
        });
      }


      /* =====================================================
         SELLER STATS
      ===================================================== */

      if (
        path === "/api/seller/stats" &&
        method === "GET"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const productCount =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM products
            WHERE seller_id = ?
          `)
            .bind(user.id)
            .first();

        const orderCount =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM orders
            WHERE seller_id = ?
          `)
            .bind(user.id)
            .first();

        const sales =
          await db.prepare(`
            SELECT
              COALESCE(
                SUM(total_price),
                0
              ) AS total
            FROM orders
            WHERE seller_id = ?
              AND payment_status = 'paid'
          `)
            .bind(user.id)
            .first();

        return json({
          ok: true,
          stats: {
            products:
              Number(
                productCount?.count || 0
              ),
            orders:
              Number(
                orderCount?.count || 0
              ),
            paid_sales:
              Number(
                sales?.total || 0
              ),
            commission:
              Number(
                sales?.total || 0
              ) * COMMISSION_RATE
          }
        });
      }


      /* =====================================================
         ADMIN AUTH
      ===================================================== */

      const isAdminPath =
        path.startsWith("/api/admin/");

      if (isAdminPath) {
        await requireAdmin(
          env,
          request
        );
      }


      /* =====================================================
         ADMIN STATS
      ===================================================== */

      if (
        path === "/api/admin/stats" &&
        method === "GET"
      ) {
        const users =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM users
          `).first();

        const sellers =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM users
            WHERE id IN (
              SELECT DISTINCT seller_id
              FROM products
              WHERE seller_id IS NOT NULL
            )
          `).first();

        const products =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM products
            WHERE status = 'active'
          `).first();

        const orders =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM orders
          `).first();

        /*
          LOCKED SCHEMA uses total_price.
          Commission is calculated from total_price
          because orders has no commission column.
        */
        const revenue =
          await db.prepare(`
            SELECT
              COALESCE(
                SUM(total_price),
                0
              ) AS total
            FROM orders
            WHERE payment_status = 'paid'
          `).first();

        const messages =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM messages
          `).first();

        const countries =
          await db.prepare(`
            SELECT COUNT(DISTINCT country) AS count
            FROM users
            WHERE country IS NOT NULL
              AND country != ''
          `).first();

        let serviceCount = 0;

        try {
          const serviceRows =
            await db.prepare(`
              SELECT
                title,
                category,
                description,
                specs,
                brand,
                model
              FROM products
              WHERE status = 'active'
              LIMIT 2000
            `).all();

          serviceCount =
            (serviceRows.results || [])
              .filter(isServiceProduct)
              .length;
        } catch {}

        const revenueTotal =
          Number(
            revenue?.total || 0
          );

        return json({
          ok: true,
          stats: {
            users:
              Number(
                users?.count || 0
              ),

            sellers:
              Number(
                sellers?.count || 0
              ),

            products:
              Number(
                products?.count || 0
              ),

            orders:
              Number(
                orders?.count || 0
              ),

            revenue:
              revenueTotal,

            commission:
              revenueTotal *
              COMMISSION_RATE,

            messages:
              Number(
                messages?.count || 0
              ),

            countries:
              Number(
                countries?.count || 0
              ),

            services:
              serviceCount
          }
        });
      }


      /* =====================================================
         ADMIN USERS
      ===================================================== */

      if (
        path === "/api/admin/users" &&
        method === "GET"
      ) {
        const rows =
          await db.prepare(`
            SELECT
              id,
              name,
              email,
              country,
              role,
              is_active,
              is_verified,
              created_at
            FROM users
            ORDER BY id DESC
          `).all();

        return json({
          ok: true,
          users:
            rows.results || []
        });
      }


      /* =====================================================
         ADMIN SELLERS
      ===================================================== */

      if (
        path === "/api/admin/sellers" &&
        method === "GET"
      ) {
        const rows =
          await db.prepare(`
            SELECT
              u.id,
              u.name,
              u.email,
              u.country,
              u.role,
              COUNT(p.id) AS product_count
            FROM users u
            JOIN products p
              ON p.seller_id = u.id
            GROUP BY
              u.id,
              u.name,
              u.email,
              u.country,
              u.role
            ORDER BY product_count DESC
          `).all();

        return json({
          ok: true,
          sellers:
            rows.results || []
        });
      }


      /* =====================================================
         ADMIN PRODUCTS
      ===================================================== */

      if (
        path === "/api/admin/products" &&
        method === "GET"
      ) {
        const rows =
          await db.prepare(`
            SELECT
              p.*,
              u.name AS seller_name,
              u.email AS seller_email
            FROM products p
            LEFT JOIN users u
              ON u.id = p.seller_id
            ORDER BY p.id DESC
            LIMIT 2000
          `).all();

        return json({
          ok: true,
          products:
            rows.results || []
        });
      }


      /* =====================================================
         ADMIN ORDERS
      ===================================================== */

      if (
        path === "/api/admin/orders" &&
        method === "GET"
      ) {
        const rows =
          await db.prepare(`
            SELECT
              o.*,
              p.title AS product_title,
              buyer.name AS buyer_name,
              buyer.email AS buyer_email,
              seller.name AS seller_name,
              seller.email AS seller_email
            FROM orders o
            JOIN products p
              ON p.id = o.product_id
            JOIN users buyer
              ON buyer.id = o.buyer_id
            JOIN users seller
              ON seller.id = o.seller_id
            ORDER BY o.id DESC
            LIMIT 2000
          `).all();

        const orders =
          (rows.results || []).map(order => ({
            ...order,
            commission:
              number(order.total_price) *
              COMMISSION_RATE
          }));

        return json({
          ok: true,
          orders
        });
      }


      /* =====================================================
         ADMIN PAYMENTS
      ===================================================== */

      if (
        path === "/api/admin/payments" &&
        method === "GET"
      ) {
        const rows =
          await db.prepare(`
            SELECT
              o.id,
              o.buyer_id,
              o.product_id,
              o.seller_id,
              o.quantity,
              o.unit_price,
              o.total_price,
              o.currency,
              o.status,
              o.payment_status,
              o.delivery_address,
              o.delivery_country,
              o.delivery_district,
              o.delivery_phone,
              o.created_at,
              p.title AS product_title,
              buyer.name AS buyer_name,
              buyer.email AS buyer_email,
              seller.name AS seller_name,
              seller.email AS seller_email
            FROM orders o
            JOIN products p
              ON p.id = o.product_id
            JOIN users buyer
              ON buyer.id = o.buyer_id
            JOIN users seller
              ON seller.id = o.seller_id
            ORDER BY o.id DESC
            LIMIT 2000
          `).all();

        const payments =
          (rows.results || []).map(order => ({
            ...order,
            commission:
              number(order.total_price) *
              COMMISSION_RATE
          }));

        const summary = {
          total_orders:
            payments.length,

          paid:
            payments.filter(
              x =>
                normalize(
                  x.payment_status
                ) === "paid"
            ).length,

          unpaid:
            payments.filter(
              x =>
                normalize(
                  x.payment_status
                ) !== "paid"
            ).length,

          total_amount:
            payments.reduce(
              (sum, x) =>
                sum + number(x.total_price),
              0
            ),

          total_commission:
            payments.reduce(
              (sum, x) =>
                sum +
                number(x.total_price) *
                COMMISSION_RATE,
              0
            )
        };

        return json({
          ok: true,
          payments,
          summary
        });
      }


      /* =====================================================
         ADMIN SERVICES
      ===================================================== */

      if (
        path === "/api/admin/services" &&
        method === "GET"
      ) {
        const search =
          url.searchParams.get("search") ||
          "";

        const country =
          url.searchParams.get("country") ||
          "";

        const category =
          url.searchParams.get("category") ||
          "";

        const rows =
          await db.prepare(`
            SELECT
              p.*,
              u.name AS seller_name,
              u.email AS seller_email,
              u.country AS seller_country
            FROM products p
            JOIN users u
              ON u.id = p.seller_id
            WHERE p.status = 'active'
            ORDER BY p.id DESC
            LIMIT 2000
          `).all();

        let services =
          (rows.results || [])
            .filter(isServiceProduct)
            .filter(p =>
              serviceCategoryMatch(
                p,
                category
              )
            );

        if (search) {
          const q =
            normalize(search);

          services =
            services.filter(p =>
              productText(p)
                .includes(q)
            );
        }

        if (country) {
          const q =
            normalize(country);

          services =
            services.filter(p =>
              normalize(
                p.country ||
                p.seller_country
              ).includes(q)
            );
        }

        return json({
          ok: true,
          services,
          count:
            services.length
        });
      }


      /* =====================================================
         ADMIN REPORTS
      ===================================================== */

      if (
        path === "/api/admin/reports" &&
        method === "GET"
      ) {
        const usersByCountry =
          await db.prepare(`
            SELECT
              country,
              COUNT(*) AS count
            FROM users
            GROUP BY country
            ORDER BY count DESC
          `).all();

        const productsByCategory =
          await db.prepare(`
            SELECT
              category,
              COUNT(*) AS count
            FROM products
            GROUP BY category
            ORDER BY count DESC
          `).all();

        const orderStatuses =
          await db.prepare(`
            SELECT
              status,
              COUNT(*) AS count
            FROM orders
            GROUP BY status
            ORDER BY count DESC
          `).all();

        const paymentStatuses =
          await db.prepare(`
            SELECT
              payment_status,
              COUNT(*) AS count
            FROM orders
            GROUP BY payment_status
            ORDER BY count DESC
          `).all();

        const topProducts =
          await db.prepare(`
            SELECT
              p.id,
              p.title,
              COUNT(o.id) AS orders,
              COALESCE(
                SUM(o.total_price),
                0
              ) AS sales
            FROM products p
            LEFT JOIN orders o
              ON o.product_id = p.id
            GROUP BY
              p.id,
              p.title
            ORDER BY orders DESC
            LIMIT 20
          `).all();

        return json({
          ok: true,
          reports: {
            users_by_country:
              usersByCountry.results || [],

            products_by_category:
              productsByCategory.results || [],

            order_statuses:
              orderStatuses.results || [],

            payment_statuses:
              paymentStatuses.results || [],

            top_products:
              topProducts.results || []
          }
        });
      }


      /* =====================================================
         ADMIN REVIEWS
      ===================================================== */

      if (
        path === "/api/admin/reviews" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          supported: false,
          reviews: [],
          message:
            "Reviews are not enabled because the locked schema has no reviews table."
        });
      }


      /* =====================================================
         ADMIN PROMOTIONS
      ===================================================== */

      if (
        path === "/api/admin/promotions" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          supported: false,
          promotions: [],
          message:
            "Promotions are not enabled in the locked schema."
        });
      }


      /* =====================================================
         ADMIN ADS
      ===================================================== */

      if (
        path === "/api/admin/ads" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          supported: false,
          ads: [],
          message:
            "Advertising management is not enabled in the locked schema."
        });
      }


      /* =====================================================
         ADMIN CATEGORIES - GET
      ===================================================== */

      if (
        path === "/api/admin/categories" &&
        method === "GET"
      ) {
        const rows =
          await db.prepare(`
            SELECT *
            FROM categories
            ORDER BY id DESC
          `).all();

        return json({
          ok: true,
          categories:
            rows.results || []
        });
      }


      /* =====================================================
         ADMIN CATEGORIES - POST
      ===================================================== */

      if (
        path === "/api/admin/categories" &&
        method === "POST"
      ) {
        const body =
          await readJSON(request);

        const name =
          String(
            body.name ||
            body.title ||
            ""
          ).trim();

        if (!name) {
          return json({
            error:
              "Category name is required"
          }, 400);
        }

        const existing =
          await db.prepare(`
            SELECT id
            FROM categories
            WHERE name = ?
            LIMIT 1
          `)
            .bind(name)
            .first();

        if (existing) {
          return json({
            error:
              "Category already exists"
          }, 409);
        }

        const result =
          await db.prepare(`
            INSERT INTO categories
              (
                name,
                is_active
              )
            VALUES
              (?, 1)
          `)
            .bind(name)
            .run();

        return json({
          ok: true,
          message:
            "Category created",
          id:
            result.meta?.last_row_id
        }, 201);
      }


      /* =====================================================
         ADMIN ORDER UPDATE
      ===================================================== */

      const adminOrderMatch =
        path.match(
          /^\/api\/admin\/orders\/(\d+)$/
        );

      if (
        adminOrderMatch &&
        method === "PATCH"
      ) {
        const id =
          Number(
            adminOrderMatch[1]
          );

        const body =
          await readJSON(request);

        const status =
          body.status !== undefined
            ? String(body.status)
            : null;

        const paymentStatus =
          body.payment_status !== undefined
            ? String(body.payment_status)
            : null;

        if (
          status !== null &&
          paymentStatus !== null
        ) {
          await db.prepare(`
            UPDATE orders
            SET
              status = ?,
              payment_status = ?
            WHERE id = ?
          `)
            .bind(
              status,
              paymentStatus,
              id
            )
            .run();

        } else if (
          status !== null
        ) {
          await db.prepare(`
            UPDATE orders
            SET status = ?
            WHERE id = ?
          `)
            .bind(
              status,
              id
            )
            .run();

        } else if (
          paymentStatus !== null
        ) {
          await db.prepare(`
            UPDATE orders
            SET payment_status = ?
            WHERE id = ?
          `)
            .bind(
              paymentStatus,
              id
            )
            .run();

        } else {
          return json({
            error:
              "status or payment_status is required"
          }, 400);
        }

        return json({
          ok: true,
          message:
            "Order updated"
        });
      }


      /* =====================================================
         ADMIN USER UPDATE
      ===================================================== */

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
            env,
            request
          );

        const id =
          Number(
            adminUserMatch[1]
          );

        const body =
          await readJSON(request);

        const target =
          await db.prepare(`
            SELECT *
            FROM users
            WHERE id = ?
          `)
            .bind(id)
            .first();

        if (!target) {
          return json({
            error:
              "User not found"
          }, 404);
        }

        const role =
          body.role !== undefined
            ? String(body.role)
            : target.role;

        const isActive =
          body.is_active !== undefined
            ? (body.is_active ? 1 : 0)
            : target.is_active;

        const isVerified =
          body.is_verified !== undefined
            ? (body.is_verified ? 1 : 0)
            : target.is_verified;

        if (
          Number(id) ===
            Number(admin.id) &&
          !isActive
        ) {
          return json({
            error:
              "You cannot deactivate your own admin account"
          }, 400);
        }

        await db.prepare(`
          UPDATE users
          SET
            role = ?,
            is_active = ?,
            is_verified = ?
          WHERE id = ?
        `)
          .bind(
            role,
            isActive,
            isVerified,
            id
          )
          .run();

        return json({
          ok: true,
          message:
            "User updated"
        });
      }


      /* =====================================================
         ADMIN PRODUCT STATUS UPDATE
      ===================================================== */

      const adminProductMatch =
        path.match(
          /^\/api\/admin\/products\/(\d+)$/
        );

      if (
        adminProductMatch &&
        method === "PATCH"
      ) {
        const id =
          Number(
            adminProductMatch[1]
          );

        const body =
          await readJSON(request);

        const status =
          String(
            body.status || ""
          ).trim();

        if (!status) {
          return json({
            error:
              "status is required"
          }, 400);
        }

        const existing =
          await db.prepare(`
            SELECT id
            FROM products
            WHERE id = ?
          `)
            .bind(id)
            .first();

        if (!existing) {
          return json({
            error:
              "Product not found"
          }, 404);
        }

        await db.prepare(`
          UPDATE products
          SET status = ?
          WHERE id = ?
        `)
          .bind(
            status,
            id
          )
          .run();

        return json({
          ok: true,
          message:
            "Product status updated"
        });
      }


      /* =====================================================
         SERVICE SEARCH
      ===================================================== */

      if (
        path === "/api/service-search" &&
        method === "GET"
      ) {
        const search =
          url.searchParams.get("search") ||
          url.searchParams.get("q") ||
          "";

        const category =
          url.searchParams.get("category") ||
          "";

        const country =
          url.searchParams.get("country") ||
          "";

        const city =
          url.searchParams.get("city") ||
          url.searchParams.get("district") ||
          "";

        const provider =
          url.searchParams.get("provider") ||
          "";

        const limit =
          limitValue(
            url.searchParams.get("limit"),
            100,
            500
          );

        const rows =
          await db.prepare(`
            SELECT
              p.*,
              u.name AS seller_name,
              u.email AS seller_email,
              u.country AS seller_country
            FROM products p
            JOIN users u
              ON u.id = p.seller_id
            WHERE p.status = 'active'
              AND u.is_active = 1
            ORDER BY p.id DESC
            LIMIT 2000
          `).all();

        let services =
          (rows.results || [])
            .filter(isServiceProduct);

        if (search) {
          const q =
            normalize(search);

          services =
            services.filter(p =>
              productText(p)
                .includes(q)
            );
        }

        if (category) {
          services =
            services.filter(p =>
              serviceCategoryMatch(
                p,
                category
              )
            );
        }

        if (country) {
          const q =
            normalize(country);

          services =
            services.filter(p =>
              normalize(
                p.country ||
                p.seller_country
              ).includes(q)
            );
        }

        if (city) {
          const q =
            normalize(city);

          services =
            services.filter(p =>
              normalize(
                p.district
              ).includes(q)
            );
        }

        if (provider) {
          const q =
            normalize(provider);

          services =
            services.filter(p =>
              normalize(
                p.seller_name
              ).includes(q)
            );
        }

        services =
          services.slice(0, limit);

        return json({
          ok: true,
          services,
          count:
            services.length,
          global: true
        });
      }


      /* =====================================================
         CLOUDFLARE ASSETS
      ===================================================== */

      if (
        env.ASSETS &&
        !path.startsWith("/api/")
      ) {
        return env.ASSETS.fetch(request);
      }

      return json({
        error:
          "API route not found",
        path
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
          error:
            "Authentication required"
        }, 401);
      }

      if (
        error.message ===
        "ADMIN_ONLY"
      ) {
        return json({
          error:
            "Admin access required"
        }, 403);
      }

      return json({
        error:
          error.message ||
          "Internal server error"
      }, 500);
    }
  }
};
