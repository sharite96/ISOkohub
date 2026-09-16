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

/*
  193 UN member states.
  Used by /api/countries and global service/product filters.
*/
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Côte d'Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Türkiye",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

const SERVICE_KEYWORDS = [
  "service",
  "services",
  "consultant",
  "consulting",
  "engineer",
  "engineering",
  "developer",
  "development",
  "designer",
  "design",
  "repair",
  "installation",
  "construction",
  "architect",
  "architecture",
  "teacher",
  "teaching",
  "tutor",
  "course",
  "training",
  "photographer",
  "photography",
  "videographer",
  "video",
  "film",
  "filmmaker",
  "actor",
  "producer",
  "marketing",
  "advertising",
  "lawyer",
  "legal",
  "accounting",
  "accountant",
  "finance",
  "insurance",
  "doctor",
  "clinic",
  "health",
  "wellness",
  "beauty",
  "salon",
  "barber",
  "makeup",
  "catering",
  "restaurant",
  "hotel",
  "event",
  "wedding",
  "transport",
  "driver",
  "delivery",
  "logistics",
  "travel",
  "tour",
  "agriculture",
  "farming",
  "industrial",
  "manufacturing",
  "freelance",
  "job",
  "professional",
  "business"
];

/* =========================================================
   HELPERS
   ========================================================= */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });

const readJSON = async request => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const sha256 = async value => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
};

const tokenFromRequest = request => {
  const auth = request.headers.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
};

const authenticate = async (request, env) => {
  const token = tokenFromRequest(request);
  if (!token) return null;

  const tokenHash = await sha256(token);

  const result = await env.DB.prepare(`
    SELECT
      s.id AS session_id,
      s.user_id,
      s.expires_at,
      u.id,
      u.name,
      u.email,
      u.country,
      u.role,
      u.is_active,
      u.is_verified,
      u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.expires_at > datetime('now')
      AND u.is_active = 1
    LIMIT 1
  `).bind(tokenHash).first();

  return result || null;
};

const safeUser = user => {
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
};

const requireDB = env => {
  if (!env || !env.DB) {
    throw new Error("D1 database binding DB is not available.");
  }
};

const requireUser = async (request, env) => {
  requireDB(env);

  const user = await authenticate(request, env);

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
};

const requireAdmin = async (request, env) => {
  const user = await requireUser(request, env);

  if (user.role !== "admin") {
    throw new Error("ADMIN_ONLY");
  }

  return user;
};

const number = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const limitValue = value => {
  const n = Math.floor(number(value, 24));
  return Math.min(Math.max(n, 1), 100);
};

const normalize = value =>
  String(value || "")
    .trim()
    .toLowerCase();

const isServiceProduct = product => {
  const category = normalize(product.category);
  const title = normalize(product.title);
  const description = normalize(product.description);
  const specs = normalize(product.specs);

  if (
    SERVICE_CATEGORIES.some(
      c => normalize(c) === category
    )
  ) {
    return true;
  }

  const combined =
    `${category} ${title} ${description} ${specs}`;

  return SERVICE_KEYWORDS.some(keyword =>
    combined.includes(keyword)
  );
};

const serviceCategoryMatch = (product, category) => {
  if (!category) return true;

  const requested = normalize(category);
  const actual = normalize(product.category);

  if (actual === requested) return true;

  const text =
    `${product.title || ""} ${product.description || ""} ${product.specs || ""}`
      .toLowerCase();

  const map = {
    "business & professional": [
      "business",
      "consult",
      "professional",
      "account",
      "management"
    ],
    "engineering": [
      "engineer",
      "engineering",
      "civil",
      "mechanical",
      "electrical",
      "software engineer"
    ],
    "it & technology": [
      "it",
      "technology",
      "software",
      "developer",
      "website",
      "app",
      "computer",
      "cyber"
    ],
    "construction & property": [
      "construction",
      "architect",
      "property",
      "building",
      "plumbing",
      "electrician"
    ],
    "education & teachers": [
      "teacher",
      "tutor",
      "education",
      "course",
      "training",
      "school"
    ],
    "art & creative": [
      "artist",
      "graphic",
      "design",
      "photography",
      "creative",
      "fashion"
    ],
    "film & entertainment": [
      "film",
      "filmmaker",
      "actor",
      "producer",
      "video",
      "entertainment"
    ],
    "marketing & communication": [
      "marketing",
      "advertising",
      "social media",
      "communication",
      "branding"
    ],
    "automotive & transport": [
      "car",
      "automotive",
      "transport",
      "driver",
      "vehicle",
      "mechanic"
    ],
    "agriculture & environment": [
      "agriculture",
      "farming",
      "environment",
      "garden",
      "irrigation"
    ],
    "home services": [
      "cleaning",
      "home",
      "repair",
      "plumbing",
      "electrician",
      "moving"
    ],
    "legal & finance": [
      "lawyer",
      "legal",
      "finance",
      "accounting",
      "accountant",
      "tax"
    ],
    "health & wellness": [
      "health",
      "doctor",
      "clinic",
      "wellness",
      "fitness",
      "therapy"
    ],
    "beauty & personal care": [
      "beauty",
      "salon",
      "barber",
      "makeup",
      "hair"
    ],
    "food & hospitality": [
      "food",
      "catering",
      "restaurant",
      "hotel",
      "hospitality",
      "chef"
    ],
    "events": [
      "event",
      "wedding",
      "party",
      "decoration",
      "dj"
    ],
    "logistics": [
      "logistics",
      "delivery",
      "shipping",
      "warehouse",
      "courier"
    ],
    "travel & tourism": [
      "travel",
      "tour",
      "tourism",
      "hotel",
      "guide",
      "safari"
    ],
    "industrial & manufacturing": [
      "industrial",
      "manufacturing",
      "factory",
      "machine",
      "production"
    ],
    "jobs & freelance": [
      "job",
      "freelance",
      "freelancer",
      "remote",
      "work"
    ]
  };

  const keywords = map[requested] || [];

  return keywords.some(keyword =>
    text.includes(keyword)
  );
};

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

    try {
      requireDB(env);

      /* =====================================================
         HEALTH
         ===================================================== */

      if (path === "/api/health" && method === "GET") {
        let database = "connected";

        try {
          await env.DB.prepare("SELECT 1").first();
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

      /* =====================================================
         CONFIG
         ===================================================== */

      if (path === "/api/config" && method === "GET") {
        return json({
          production: true,
          platform: "cloudflare-workers",
          database: "D1",
          assets: "Cloudflare Assets",
          marketplace: "global",
          countries: 193,
          service_platform: true,
          commission_rate: COMMISSION_RATE
        });
      }

      /* =====================================================
         COUNTRIES
         ===================================================== */

      if (path === "/api/countries" && method === "GET") {
        const search = normalize(
          url.searchParams.get("search")
        );

        const countries = search
          ? COUNTRIES.filter(country =>
              country.toLowerCase().includes(search)
            )
          : COUNTRIES;

        return json({
          count: countries.length,
          countries
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
          count: SERVICE_CATEGORIES.length,
          categories: SERVICE_CATEGORIES
        });
      }

      /* =====================================================
         CATEGORIES
         ===================================================== */

      if (path === "/api/categories" && method === "GET") {
        const result = await env.DB.prepare(`
          SELECT *
          FROM categories
          WHERE is_active = 1
          ORDER BY name ASC
        `).all();

        return json({
          categories: result.results || []
        });
      }

      /* =====================================================
         PRODUCTS
         ===================================================== */

      if (path === "/api/products" && method === "GET") {
        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";
        const country = url.searchParams.get("country") || "";
        const limit = limitValue(
          url.searchParams.get("limit")
        );

        const params = [];
        const conditions = [
          "p.status = 'active'",
          "u.is_active = 1"
        ];

        if (search) {
          conditions.push(`
            (
              p.title LIKE ?
              OR p.description LIKE ?
              OR p.category LIKE ?
              OR p.brand LIKE ?
              OR p.model LIKE ?
              OR p.specs LIKE ?
            )
          `);

          const q = `%${search}%`;

          params.push(q, q, q, q, q, q);
        }

        if (category) {
          conditions.push("p.category LIKE ?");
          params.push(`%${category}%`);
        }

        if (country) {
          conditions.push("p.country LIKE ?");
          params.push(`%${country}%`);
        }

        const sql = `
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.country AS seller_country,
            u.is_verified AS seller_verified
          FROM products p
          LEFT JOIN users u ON u.id = p.seller_id
          WHERE ${conditions.join(" AND ")}
          ORDER BY p.created_at DESC
          LIMIT ?
        `;

        params.push(limit);

        const result = await env.DB
          .prepare(sql)
          .bind(...params)
          .all();

        return json({
          products: result.results || [],
          count: (result.results || []).length
        });
      }

      /* =====================================================
         SINGLE PRODUCT
         ===================================================== */

      const productMatch =
        path.match(/^\/api\/products\/(\d+)$/);

      if (
        productMatch &&
        method === "GET"
      ) {
        const id = productMatch[1];

        const product = await env.DB.prepare(`
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.country AS seller_country,
            u.is_verified AS seller_verified
          FROM products p
          LEFT JOIN users u ON u.id = p.seller_id
          WHERE p.id = ?
          LIMIT 1
        `).bind(id).first();

        if (!product) {
          return json({
            error: "Product not found"
          }, 404);
        }

        try {
          await env.DB.prepare(`
            UPDATE products
            SET views = COALESCE(views, 0) + 1
            WHERE id = ?
          `).bind(id).run();
        } catch {}

        return json({
          product
        });
      }

      /* =====================================================
         GLOBAL SERVICES
         ===================================================== */

      if (
        path === "/api/services" &&
        method === "GET"
      ) {
        const search = normalize(
          url.searchParams.get("search")
        );

        const category =
          url.searchParams.get("category") || "";

        const country =
          url.searchParams.get("country") || "";

        const district =
          url.searchParams.get("city") ||
          url.searchParams.get("district") ||
          "";

        const provider =
          url.searchParams.get("provider") ||
          url.searchParams.get("seller") ||
          "";

        const online =
          url.searchParams.get("online") || "";

        const limit = limitValue(
          url.searchParams.get("limit")
        );

        /*
          We intentionally retrieve a manageable global set
          and classify services in JavaScript so existing
          schema.sql does not need to change.
        */

        const conditions = [
          "p.status = 'active'",
          "u.is_active = 1"
        ];

        const params = [];

        if (country) {
          conditions.push("p.country LIKE ?");
          params.push(`%${country}%`);
        }

        if (district) {
          conditions.push("p.district LIKE ?");
          params.push(`%${district}%`);
        }

        if (provider) {
          conditions.push("u.name LIKE ?");
          params.push(`%${provider}%`);
        }

        /*
          Search is deliberately broad. This allows searches
          such as:
          civil engineer
          photographer
          business consultant
          web developer
          teacher
          lawyer
          driver
          etc.
        */

        if (search) {
          conditions.push(`
            (
              p.title LIKE ?
              OR p.description LIKE ?
              OR p.category LIKE ?
              OR p.specs LIKE ?
              OR u.name LIKE ?
            )
          `);

          const q = `%${search}%`;
          params.push(q, q, q, q, q);
        }

        const sql = `
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email,
            u.country AS seller_country,
            u.is_verified AS seller_verified
          FROM products p
          LEFT JOIN users u ON u.id = p.seller_id
          WHERE ${conditions.join(" AND ")}
          ORDER BY p.created_at DESC
          LIMIT 200
        `;

        const result = await env.DB
          .prepare(sql)
          .bind(...params)
          .all();

        let services = (result.results || [])
          .filter(isServiceProduct)
          .filter(product =>
            serviceCategoryMatch(product, category)
          );

        if (online) {
          services = services.filter(product => {
            const text =
              `${product.title || ""} ${product.description || ""} ${product.specs || ""}`
                .toLowerCase();

            return (
              online === "true"
                ? (
                    text.includes("online") ||
                    text.includes("remote") ||
                    text.includes("virtual")
                  )
                : true
            );
          });
        }

        services = services.slice(0, limit);

        return json({
          services,
          count: services.length,
          country: country || "All countries",
          city: district || "All cities",
          category: category || "All services",
          provider: provider || "All providers",
          global: true,
          countries: 193
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

        const name = String(body.name || "").trim();
        const email = String(body.email || "")
          .trim()
          .toLowerCase();

        const password = String(body.password || "");

        const country =
          String(body.country || "Rwanda").trim();

        if (!name || !email || !password) {
          return json({
            error: "Name, email and password are required."
          }, 400);
        }

        if (password.length < 6) {
          return json({
            error: "Password must be at least 6 characters."
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
            error: "Email already registered."
          }, 409);
        }

        const passwordHash =
          await sha256(password);

        const result = await env.DB.prepare(`
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
          VALUES (?, ?, ?, ?, 'buyer', 1, 0)
        `).bind(
          name,
          email,
          passwordHash,
          country
        ).run();

        return json({
          ok: true,
          user_id: result.meta.last_row_id
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

        const email = String(body.email || "")
          .trim()
          .toLowerCase();

        const password =
          String(body.password || "");

        if (!email || !password) {
          return json({
            error: "Email and password are required."
          }, 400);
        }

        const user = await env.DB.prepare(`
          SELECT *
          FROM users
          WHERE email = ?
          LIMIT 1
        `).bind(email).first();

        if (!user) {
          return json({
            error: "Invalid email or password."
          }, 401);
        }

        if (!user.is_active) {
          return json({
            error: "This account is inactive."
          }, 403);
        }

        const passwordHash =
          await sha256(password);

        if (passwordHash !== user.password_hash) {
          return json({
            error: "Invalid email or password."
          }, 401);
        }

        const rawToken =
          crypto.randomUUID() +
          "-" +
          crypto.randomUUID();

        const tokenHash =
          await sha256(rawToken);

        const expiresAt =
          new Date(
            Date.now() +
            30 * 24 * 60 * 60 * 1000
          ).toISOString();

        await env.DB.prepare(`
          INSERT INTO sessions
          (
            user_id,
            token_hash,
            expires_at
          )
          VALUES (?, ?, ?)
        `).bind(
          user.id,
          tokenHash,
          expiresAt
        ).run();

        return json({
          ok: true,
          token: rawToken,
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
          await requireUser(request, env);

        return json({
          user: safeUser(user)
        });
      }

      if (
        path === "/api/me" &&
        method === "PATCH"
      ) {
        const user =
          await requireUser(request, env);

        const body = await readJSON(request);

        const name =
          body.name !== undefined
            ? String(body.name).trim()
            : user.name;

        const country =
          body.country !== undefined
            ? String(body.country).trim()
            : user.country;

        await env.DB.prepare(`
          UPDATE users
          SET
            name = ?,
            country = ?
          WHERE id = ?
        `).bind(
          name,
          country,
          user.user_id
        ).run();

        const updated =
          await env.DB.prepare(`
            SELECT *
            FROM users
            WHERE id = ?
            LIMIT 1
          `).bind(user.user_id).first();

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

          await env.DB.prepare(`
            DELETE FROM sessions
            WHERE token_hash = ?
          `).bind(hash).run();
        }

        return json({
          ok: true
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
          await requireUser(request, env);

        const body = await readJSON(request);

        const title =
          String(body.title || "").trim();

        const category =
          String(body.category || "Other").trim();

        const description =
          String(body.description || "").trim();

        const price =
          number(body.price, 0);

        const currency =
          String(body.currency || "RWF").trim();

        const stock =
          Math.max(
            0,
            Math.floor(number(body.stock, 1))
          );

        const condition =
          String(body.condition || "new").trim();

        const country =
          String(
            body.country ||
            user.country ||
            "Rwanda"
          ).trim();

        const district =
          String(
            body.district ||
            body.city ||
            ""
          ).trim();

        const brand =
          String(body.brand || "").trim();

        const model =
          String(body.model || "").trim();

        const storage =
          String(body.storage || "").trim();

        const ram =
          String(body.ram || "").trim();

        const imageUrl =
          String(body.image_url || "").trim();

        const specs =
          String(body.specs || "").trim();

        const negotiable =
          body.negotiable ? 1 : 0;

        if (!title) {
          return json({
            error: "Title is required."
          }, 400);
        }

        const validConditions = [
          "new",
          "used",
          "has crack",
          "refurbished"
        ];

        const safeCondition =
          validConditions.includes(condition)
            ? condition
            : "new";

        const result = await env.DB.prepare(`
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
            status,
            views
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)
        `).bind(
          user.user_id,
          title,
          category,
          description,
          price,
          currency,
          stock,
          brand,
          model,
          safeCondition,
          country,
          district,
          storage,
          ram,
          imageUrl,
          specs,
          negotiable
        ).run();

        return json({
          ok: true,
          product_id: result.meta.last_row_id
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
          await requireUser(request, env);

        const id = productMatch[1];

        const product =
          await env.DB.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
            LIMIT 1
          `).bind(id).first();

        if (!product) {
          return json({
            error: "Product not found."
          }, 404);
        }

        if (
          product.seller_id !== user.user_id &&
          user.role !== "admin"
        ) {
          return json({
            error: "Not allowed."
          }, 403);
        }

        const body = await readJSON(request);

        const fields = [
          "title",
          "category",
          "description",
          "price",
          "currency",
          "stock",
          "brand",
          "model",
          "condition",
          "country",
          "district",
          "storage",
          "ram",
          "image_url",
          "specs",
          "negotiable",
          "status"
        ];

        const updates = [];
        const values = [];

        for (const field of fields) {
          if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(body[field]);
          }
        }

        if (!updates.length) {
          return json({
            error: "No changes supplied."
          }, 400);
        }

        values.push(id);

        await env.DB.prepare(`
          UPDATE products
          SET ${updates.join(", ")}
          WHERE id = ?
        `).bind(...values).run();

        return json({
          ok: true
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
          await requireUser(request, env);

        const id = productMatch[1];

        const product =
          await env.DB.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
            LIMIT 1
          `).bind(id).first();

        if (!product) {
          return json({
            error: "Product not found."
          }, 404);
        }

        if (
          product.seller_id !== user.user_id &&
          user.role !== "admin"
        ) {
          return json({
            error: "Not allowed."
          }, 403);
        }

        await env.DB.prepare(`
          DELETE FROM products
          WHERE id = ?
        `).bind(id).run();

        return json({
          ok: true
        });
      }

      /* =====================================================
         SAVED PRODUCTS
         ===================================================== */

      if (
        path === "/api/saved" &&
        method === "GET"
      ) {
        const user =
          await requireUser(request, env);

        const result = await env.DB.prepare(`
          SELECT
            sp.*,
            p.title,
            p.price,
            p.currency,
            p.image_url,
            p.country,
            p.district,
            p.status
          FROM saved_products sp
          JOIN products p ON p.id = sp.product_id
          WHERE sp.user_id = ?
          ORDER BY sp.created_at DESC
        `).bind(user.user_id).all();

        return json({
          saved: result.results || []
        });
      }

      if (
        path === "/api/saved" &&
        method === "POST"
      ) {
        const user =
          await requireUser(request, env);

        const body =
          await readJSON(request);

        const productId =
          number(body.product_id, 0);

        if (!productId) {
          return json({
            error: "product_id is required."
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
          user.user_id,
          productId
        ).run();

        return json({
          ok: true
        });
      }

      const savedMatch =
        path.match(/^\/api\/saved\/(\d+)$/);

      if (
        savedMatch &&
        method === "DELETE"
      ) {
        const user =
          await requireUser(request, env);

        await env.DB.prepare(`
          DELETE FROM saved_products
          WHERE user_id = ?
            AND product_id = ?
        `).bind(
          user.user_id,
          savedMatch[1]
        ).run();

        return json({
          ok: true
        });
      }

      /* =====================================================
         ORDERS
         ===================================================== */

      if (
        path === "/api/orders" &&
        method === "GET"
      ) {
        const user =
          await requireUser(request, env);

        const result = await env.DB.prepare(`
          SELECT
            o.*,
            p.title,
            p.image_url,
            p.currency,
            buyer.name AS buyer_name,
            buyer.email AS buyer_email,
            seller.name AS seller_name,
            seller.email AS seller_email
          FROM orders o
          JOIN products p ON p.id = o.product_id
          JOIN users buyer ON buyer.id = o.buyer_id
          JOIN users seller ON seller.id = p.seller_id
          WHERE
            o.buyer_id = ?
            OR p.seller_id = ?
          ORDER BY o.created_at DESC
        `).bind(
          user.user_id,
          user.user_id
        ).all();

        return json({
          orders: result.results || []
        });
      }

      if (
        path === "/api/orders" &&
        method === "POST"
      ) {
        const user =
          await requireUser(request, env);

        const body =
          await readJSON(request);

        const productId =
          number(body.product_id, 0);

        const quantity =
          Math.max(
            1,
            Math.floor(
              number(body.quantity, 1)
            )
          );

        if (!productId) {
          return json({
            error: "product_id is required."
          }, 400);
        }

        const product =
          await env.DB.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
              AND status = 'active'
            LIMIT 1
          `).bind(productId).first();

        if (!product) {
          return json({
            error: "Product not found or inactive."
          }, 404);
        }

        if (product.seller_id === user.user_id) {
          return json({
            error: "You cannot order your own product."
          }, 400);
        }

        if (number(product.stock) < quantity) {
          return json({
            error: "Insufficient stock."
          }, 400);
        }

        const total =
          number(product.price) * quantity;

        const commission =
          total * COMMISSION_RATE;

        const result =
          await env.DB.prepare(`
            INSERT INTO orders
            (
              buyer_id,
              product_id,
              quantity,
              unit_price,
              total_amount,
              commission_amount,
              status,
              payment_status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pending', 'unpaid')
          `).bind(
            user.user_id,
            productId,
            quantity,
            product.price,
            total,
            commission
          ).run();

        await env.DB.prepare(`
          UPDATE products
          SET stock = stock - ?
          WHERE id = ?
        `).bind(
          quantity,
          productId
        ).run();

        return json({
          ok: true,
          order_id: result.meta.last_row_id,
          total_amount: total,
          commission_amount: commission
        }, 201);
      }

      /* =====================================================
         MESSAGES
         ===================================================== */

      if (
        path === "/api/messages" &&
        method === "GET"
      ) {
        const user =
          await requireUser(request, env);

        const result = await env.DB.prepare(`
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
          ORDER BY m.created_at ASC
        `).bind(
          user.user_id,
          user.user_id
        ).all();

        return json({
          messages: result.results || []
        });
      }

      if (
        path === "/api/messages" &&
        method === "POST"
      ) {
        const user =
          await requireUser(request, env);

        const body =
          await readJSON(request);

        const receiverId =
          number(body.receiver_id, 0);

        const message =
          String(body.message || "").trim();

        if (!receiverId || !message) {
          return json({
            error: "receiver_id and message are required."
          }, 400);
        }

        const result =
          await env.DB.prepare(`
            INSERT INTO messages
            (
              sender_id,
              receiver_id,
              message
            )
            VALUES (?, ?, ?)
          `).bind(
            user.user_id,
            receiverId,
            message
          ).run();

        return json({
          ok: true,
          message_id: result.meta.last_row_id
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
          await requireUser(request, env);

        const result =
          await env.DB.prepare(`
            SELECT *
            FROM products
            WHERE seller_id = ?
            ORDER BY created_at DESC
          `).bind(user.user_id).all();

        return json({
          products: result.results || []
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
          await requireUser(request, env);

        const products =
          await env.DB.prepare(`
            SELECT COUNT(*) AS count
            FROM products
            WHERE seller_id = ?
          `).bind(user.user_id).first();

        const orders =
          await env.DB.prepare(`
            SELECT COUNT(*) AS count
            FROM orders o
            JOIN products p
              ON p.id = o.product_id
            WHERE p.seller_id = ?
          `).bind(user.user_id).first();

        const sales =
          await env.DB.prepare(`
            SELECT COALESCE(SUM(o.total_amount), 0) AS total
            FROM orders o
            JOIN products p
              ON p.id = o.product_id
            WHERE
              p.seller_id = ?
              AND o.payment_status = 'paid'
          `).bind(user.user_id).first();

        return json({
          products: number(products?.count),
          orders: number(orders?.count),
          sales: number(sales?.total)
        });
      }

      /* =====================================================
         ADMIN STATS
         ===================================================== */

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
            WHERE seller_id IS NOT NULL
          `).first();

        const products =
          await env.DB.prepare(`
            SELECT COUNT(*) AS count
            FROM products
          `).first();

        const servicesRows =
          await env.DB.prepare(`
            SELECT
              id,
              title,
              description,
              category,
              specs
            FROM products
            WHERE status = 'active'
            LIMIT 1000
          `).all();

        const serviceCount =
          (servicesRows.results || [])
            .filter(isServiceProduct)
            .length;

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
              COALESCE(SUM(total_amount), 0) AS total,
              COALESCE(SUM(commission_amount), 0) AS commission
            FROM orders
            WHERE payment_status = 'paid'
          `).first();

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
          users: number(users?.count),
          sellers: number(sellers?.count),
          products: number(products?.count),
          services: serviceCount,
          orders: number(orders?.count),
          pending_orders: number(
            pendingOrders?.count
          ),
          paid_amount: number(
            paid?.total
          ),
          commission: number(
            paid?.commission
          ),
          categories: number(
            categories?.count
          ),
          messages: number(
            messages?.count
          ),
          countries: 193
        });
      }

      /* =====================================================
         ADMIN USERS
         ===================================================== */

      if (
        path === "/api/admin/users" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        const result =
          await env.DB.prepare(`
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
            ORDER BY created_at DESC
          `).all();

        return json({
          users: result.results || []
        });
      }

      /* =====================================================
         ADMIN SELLERS
         ===================================================== */

      if (
        path === "/api/admin/sellers" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        const result =
          await env.DB.prepare(`
            SELECT
              u.id,
              u.name,
              u.email,
              u.country,
              u.is_active,
              u.is_verified,
              COUNT(DISTINCT p.id) AS product_count,
              COUNT(DISTINCT o.id) AS order_count,
              COALESCE(
                SUM(
                  CASE
                    WHEN o.payment_status = 'paid'
                    THEN o.total_amount
                    ELSE 0
                  END
                ),
                0
              ) AS paid_sales
            FROM users u
            JOIN products p
              ON p.seller_id = u.id
            LEFT JOIN orders o
              ON o.product_id = p.id
            GROUP BY u.id
            ORDER BY product_count DESC
          `).all();

        return json({
          sellers: result.results || []
        });
      }

      /* =====================================================
         ADMIN PRODUCTS
         ===================================================== */

      if (
        path === "/api/admin/products" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        const result =
          await env.DB.prepare(`
            SELECT
              p.*,
              u.name AS seller_name,
              u.email AS seller_email
            FROM products p
            LEFT JOIN users u
              ON u.id = p.seller_id
            ORDER BY p.created_at DESC
          `).all();

        return json({
          products: result.results || []
        });
      }

      /* =====================================================
         ADMIN ORDERS
         ===================================================== */

      if (
        path === "/api/admin/orders" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        const result =
          await env.DB.prepare(`
            SELECT
              o.*,
              p.title,
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
              ON seller.id = p.seller_id
            ORDER BY o.created_at DESC
          `).all();

        return json({
          orders: result.results || []
        });
      }

      /* =====================================================
         ADMIN PAYMENTS
         ===================================================== */

      if (
        path === "/api/admin/payments" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        const rows =
          await env.DB.prepare(`
            SELECT
              o.id,
              o.product_id,
              o.buyer_id,
              o.quantity,
              o.unit_price,
              o.total_amount,
              o.commission_amount,
              o.status,
              o.payment_status,
              o.created_at,
              p.title,
              buyer.name AS buyer_name,
              seller.name AS seller_name
            FROM orders o
            JOIN products p
              ON p.id = o.product_id
            JOIN users buyer
              ON buyer.id = o.buyer_id
            JOIN users seller
              ON seller.id = p.seller_id
            ORDER BY o.created_at DESC
          `).all();

        const summary =
          await env.DB.prepare(`
            SELECT
              COALESCE(
                SUM(
                  CASE
                    WHEN payment_status = 'paid'
                    THEN total_amount
                    ELSE 0
                  END
                ),
                0
              ) AS paid_amount,
              COALESCE(
                SUM(
                  CASE
                    WHEN payment_status = 'paid'
                    THEN commission_amount
                    ELSE 0
                  END
                ),
                0
              ) AS commission
            FROM orders
          `).first();

        return json({
          payments: rows.results || [],
          summary: {
            paid_amount: number(
              summary?.paid_amount
            ),
            commission: number(
              summary?.commission
            )
          }
        });
      }

      /* =====================================================
         ADMIN SERVICES
         ===================================================== */

      if (
        path === "/api/admin/services" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        const search =
          normalize(
            url.searchParams.get("search")
          );

        const country =
          url.searchParams.get("country") || "";

        const category =
          url.searchParams.get("category") || "";

        const rows =
          await env.DB.prepare(`
            SELECT
              p.*,
              u.name AS seller_name,
              u.email AS seller_email,
              u.country AS seller_country,
              u.is_verified AS seller_verified
            FROM products p
            LEFT JOIN users u
              ON u.id = p.seller_id
            WHERE p.status = 'active'
            ORDER BY p.created_at DESC
            LIMIT 1000
          `).all();

        let services =
          (rows.results || [])
            .filter(isServiceProduct);

        if (search) {
          services =
            services.filter(p => {
              const text =
                `${p.title || ""} ${p.description || ""} ${p.category || ""} ${p.specs || ""} ${p.seller_name || ""}`
                  .toLowerCase();

              return text.includes(search);
            });
        }

        if (country) {
          services =
            services.filter(p =>
              normalize(p.country)
                .includes(
                  normalize(country)
                )
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

        return json({
          services,
          count: services.length,
          categories: SERVICE_CATEGORIES,
          countries: 193
        });
      }

      /* =====================================================
         ADMIN REPORTS
         ===================================================== */

      if (
        path === "/api/admin/reports" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        const usersByCountry =
          await env.DB.prepare(`
            SELECT
              country,
              COUNT(*) AS count
            FROM users
            GROUP BY country
            ORDER BY count DESC
          `).all();

        const productsByCategory =
          await env.DB.prepare(`
            SELECT
              category,
              COUNT(*) AS count
            FROM products
            GROUP BY category
            ORDER BY count DESC
          `).all();

        const orderStatuses =
          await env.DB.prepare(`
            SELECT
              status,
              COUNT(*) AS count
            FROM orders
            GROUP BY status
          `).all();

        const paymentStatuses =
          await env.DB.prepare(`
            SELECT
              payment_status,
              COUNT(*) AS count
            FROM orders
            GROUP BY payment_status
          `).all();

        const topProducts =
          await env.DB.prepare(`
            SELECT
              p.id,
              p.title,
              p.views,
              COALESCE(
                SUM(o.quantity),
                0
              ) AS sold_quantity
            FROM products p
            LEFT JOIN orders o
              ON o.product_id = p.id
            GROUP BY p.id
            ORDER BY sold_quantity DESC
            LIMIT 20
          `).all();

        return json({
          users_by_country:
            usersByCountry.results || [],

          products_by_category:
            productsByCategory.results || [],

          order_statuses:
            orderStatuses.results || [],

          payment_statuses:
            paymentStatuses.results || [],

          top_products:
            topProducts.results || [],

          global_countries: 193
        });
      }

      /* =====================================================
         ADMIN REVIEWS
         ===================================================== */

      if (
        path === "/api/admin/reviews" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        return json({
          supported: false,
          reviews: [],
          message:
            "Reviews are ready in the admin interface, but the locked schema.sql does not contain a reviews table yet."
        });
      }

      /* =====================================================
         ADMIN PROMOTIONS
         ===================================================== */

      if (
        path === "/api/admin/promotions" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        return json({
          supported: false,
          promotions: [],
          message:
            "Promotions are ready in the admin interface, but the locked schema.sql does not contain a promotions table yet."
        });
      }

      /* =====================================================
         ADMIN ADS
         ===================================================== */

      if (
        path === "/api/admin/ads" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        return json({
          supported: false,
          ads: [],
          message:
            "Ads are ready in the admin interface, but the locked schema.sql does not contain an ads table yet."
        });
      }

      /* =====================================================
         ADMIN CATEGORIES
         ===================================================== */

      if (
        path === "/api/admin/categories" &&
        method === "GET"
      ) {
        await requireAdmin(request, env);

        const result =
          await env.DB.prepare(`
            SELECT *
            FROM categories
            ORDER BY name ASC
          `).all();

        return json({
          categories: result.results || []
        });
      }

      if (
        path === "/api/admin/categories" &&
        method === "POST"
      ) {
        await requireAdmin(request, env);

        const body =
          await readJSON(request);

        const name =
          String(body.name || "").trim();

        if (!name) {
          return json({
            error: "Category name is required."
          }, 400);
        }

        const result =
          await env.DB.prepare(`
            INSERT INTO categories
            (
              name,
              is_active
            )
            VALUES (?, 1)
          `).bind(name).run();

        return json({
          ok: true,
          category_id:
            result.meta.last_row_id
        }, 201);
      }

      /* =====================================================
         ADMIN UPDATE ORDER
         ===================================================== */

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
          adminOrderMatch[1];

        const body =
          await readJSON(request);

        const updates = [];
        const values = [];

        if (body.status !== undefined) {
          updates.push("status = ?");
          values.push(
            String(body.status)
          );
        }

        if (
          body.payment_status !== undefined
        ) {
          updates.push(
            "payment_status = ?"
          );

          values.push(
            String(
              body.payment_status
            )
          );
        }

        if (!updates.length) {
          return json({
            error: "No changes supplied."
          }, 400);
        }

        values.push(id);

        await env.DB.prepare(`
          UPDATE orders
          SET ${updates.join(", ")}
          WHERE id = ?
        `).bind(...values).run();

        return json({
          ok: true
        });
      }

      /* =====================================================
         ADMIN UPDATE USER
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
            request,
            env
          );

        const id =
          adminUserMatch[1];

        const body =
          await readJSON(request);

        const updates = [];
        const values = [];

        if (body.role !== undefined) {
          const role =
            String(body.role);

          if (
            ![
              "buyer",
              "seller",
              "admin"
            ].includes(role)
          ) {
            return json({
              error: "Invalid role."
            }, 400);
          }

          updates.push("role = ?");
          values.push(role);
        }

        if (
          body.is_active !== undefined
        ) {
          updates.push(
            "is_active = ?"
          );

          values.push(
            body.is_active ? 1 : 0
          );
        }

        if (
          body.is_verified !== undefined
        ) {
          updates.push(
            "is_verified = ?"
          );

          values.push(
            body.is_verified ? 1 : 0
          );
        }

        if (!updates.length) {
          return json({
            error: "No changes supplied."
          }, 400);
        }

        /*
          Prevent an admin from accidentally
          disabling their own account.
        */
        if (
          String(id) ===
          String(admin.user_id) &&
          body.is_active === false
        ) {
          return json({
            error:
              "You cannot deactivate your own admin account."
          }, 400);
        }

        values.push(id);

        await env.DB.prepare(`
          UPDATE users
          SET ${updates.join(", ")}
          WHERE id = ?
        `).bind(...values).run();

        return json({
          ok: true
        });
      }

      /* =====================================================
         ADMIN UPDATE PRODUCT
         ===================================================== */

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
          adminProductMatch[1];

        const body =
          await readJSON(request);

        if (body.status === undefined) {
          return json({
            error:
              "status is required."
          }, 400);
        }

        await env.DB.prepare(`
          UPDATE products
          SET status = ?
          WHERE id = ?
        `).bind(
          String(body.status),
          id
        ).run();

        return json({
          ok: true
        });
      }

      /* =====================================================
         GLOBAL SERVICE DISCOVERY
         ===================================================== */

      if (
        path === "/api/service-search" &&
        method === "GET"
      ) {
        const search =
          url.searchParams.get("q") ||
          url.searchParams.get("search") ||
          "";

        const country =
          url.searchParams.get("country") ||
          "";

        const city =
          url.searchParams.get("city") ||
          url.searchParams.get("district") ||
          "";

        const category =
          url.searchParams.get("category") ||
          "";

        const provider =
          url.searchParams.get("provider") ||
          "";

        const limit =
          limitValue(
            url.searchParams.get("limit")
          );

        const params = [];

        const conditions = [
          "p.status = 'active'",
          "u.is_active = 1"
        ];

        if (country) {
          conditions.push(
            "p.country LIKE ?"
          );

          params.push(
            `%${country}%`
          );
        }

        if (city) {
          conditions.push(
            "p.district LIKE ?"
          );

          params.push(
            `%${city}%`
          );
        }

        if (provider) {
          conditions.push(
            "u.name LIKE ?"
          );

          params.push(
            `%${provider}%`
          );
        }

        if (search) {
          conditions.push(`
            (
              p.title LIKE ?
              OR p.description LIKE ?
              OR p.category LIKE ?
              OR p.specs LIKE ?
              OR p.brand LIKE ?
              OR p.model LIKE ?
              OR u.name LIKE ?
            )
          `);

          const q =
            `%${search}%`;

          params.push(
            q,
            q,
            q,
            q,
            q,
            q,
            q
          );
        }

        const result =
          await env.DB.prepare(`
            SELECT
              p.*,
              u.name AS seller_name,
              u.email AS seller_email,
              u.country AS seller_country,
              u.is_verified AS seller_verified
            FROM products p
            LEFT JOIN users u
              ON u.id = p.seller_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY p.created_at DESC
            LIMIT 200
          `)
            .bind(...params)
            .all();

        let services =
          (result.results || [])
            .filter(isServiceProduct)
            .filter(p =>
              serviceCategoryMatch(
                p,
                category
              )
            );

        services =
          services.slice(0, limit);

        return json({
          ok: true,
          services,
          count: services.length,
          query: {
            service: search,
            country:
              country || "All countries",
            city:
              city || "All cities",
            category:
              category || "All service categories",
            provider:
              provider || "All providers"
          },
          countries: 193,
          global: true
        });
      }

      /* =====================================================
         ASSETS / FRONTEND
         ===================================================== */

      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return json({
        error: "Not found"
      }, 404);

    } catch (error) {
      console.error("IsokoHub API error:", error);

      if (
        error &&
        error.message === "UNAUTHORIZED"
      ) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      if (
        error &&
        error.message === "ADMIN_ONLY"
      ) {
        return json({
          error: "Admin access required."
        }, 403);
      }

      return json({
        error: "Internal server error.",
        message:
          error?.message ||
          "Unknown error"
      }, 500);
    }
  }
};
