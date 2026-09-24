// ============================================================
// IsokoHub — FINAL Cloudflare Worker API
// Global Marketplace & Services
// Security: PBKDF2 + HMAC sessions + rate limiting + validation
// ============================================================

const COMMISSION_RATE = 0.05;
const PBKDF2_ITERATIONS = 150000;
const MAX_JSON_BODY = 1024 * 1024;
const SESSION_DAYS = 30;

// ------------------------------------------------------------
// SERVICE CATEGORIES
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// 193 COUNTRIES
// ------------------------------------------------------------

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola",
  "Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados",
  "Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei",
  "Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile",
  "China","Colombia","Comoros","Congo","Costa Rica",
  "Côte d'Ivoire","Croatia","Cuba","Cyprus","Czechia",
  "Democratic Republic of the Congo","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador",
  "Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Fiji","Finland","France","Gabon","Gambia","Georgia","Germany",
  "Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica",
  "Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar",
  "Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands",
  "Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco",
  "Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
  "Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger",
  "Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea",
  "Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia",
  "Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syria","Tajikistan","Tanzania","Thailand",
  "Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
  "Türkiye","Turkmenistan","Tuvalu","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia",
  "Zimbabwe"
];

// ------------------------------------------------------------
// SECURITY HEADERS
// ------------------------------------------------------------

const API_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
};

const STATIC_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "base-uri 'self'; " +
    "object-src 'none'; " +
    "frame-ancestors 'none'; " +
    "img-src 'self' https: data:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://isokohub-rwr.majyamberepierre00.workers.dev https://api.isokohub.com; " +
    "form-action 'self'"
};

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------

function allowedOrigins(env) {
  const configured =
    env.ALLOWED_ORIGINS ||
    env.Allowed_origins ||
    "";

  const defaults = [
    "https://isokohub-rw.pages.dev",
    "https://isokohub.com",
    "https://www.isokohub.com",
    "https://isokohub-rwr.majyamberepierre00.workers.dev"
  ];

  const list = configured
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  return new Set([...defaults, ...list]);
}

function corsHeaders(request, env) {
  const headers = {};
  const origin = request.headers.get("Origin");

  if (origin && allowedOrigins(env).has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  headers["Access-Control-Allow-Methods"] =
    "GET,POST,PUT,PATCH,DELETE,OPTIONS";

  headers["Access-Control-Allow-Headers"] =
    "Content-Type, Authorization";

  headers["Access-Control-Max-Age"] = "86400";

  return headers;
}

// ------------------------------------------------------------
// RESPONSE HELPERS
// ------------------------------------------------------------

function json(data, status, request, env, extra = {}) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...API_SECURITY_HEADERS,
      ...corsHeaders(request, env),
      ...extra
    }
  });
}

function errorResponse(message, status, request, env, extra = {}) {
  return json(
    {
      ok: false,
      error: message
    },
    status || 400,
    request,
    env,
    extra
  );
}

function getIP(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// ------------------------------------------------------------
// INPUT / VALIDATION
// ------------------------------------------------------------

function cleanText(value, max = 255) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function normalizeEmail(value) {
  return cleanText(value, 254).toLowerCase();
}

function validEmail(email) {
  return (
    email.length >= 3 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
}

function validCountry(country) {
  return COUNTRIES.includes(country);
}

function validCurrency(currency) {
  return /^[A-Z]{3}$/.test(currency);
}

function validURL(value) {
  if (!value) return true;

  if (value.length > 2048) return false;

  try {
    const u = new URL(value);

    return (
      u.protocol === "https:" ||
      u.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function numberValue(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function integerValue(value, fallback = 0) {
  const n = Number(value);

  if (!Number.isInteger(n)) {
    return fallback;
  }

  return n;
}

function limitValue(value, fallback = 100, max = 500) {
  const n = integerValue(value, fallback);

  return Math.max(1, Math.min(max, n));
}

function productText(product) {
  return [
    product.title,
    product.category,
    product.description,
    product.specs,
    product.country,
    product.district,
    product.city
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isServiceProduct(product) {
  const words = [
    "service",
    "course",
    "teacher",
    "education",
    "business",
    "professional",
    "engineering",
    "technology",
    "construction",
    "property",
    "creative",
    "artist",
    "film",
    "entertainment",
    "marketing",
    "communication",
    "automotive",
    "transport",
    "agriculture",
    "environment",
    "home services",
    "legal",
    "finance",
    "health",
    "wellness",
    "beauty",
    "food",
    "hospitality",
    "events",
    "logistics",
    "travel",
    "tourism",
    "industrial",
    "manufacturing",
    "jobs",
    "freelance"
  ];

  const text = productText(product);

  return words.some(word => text.includes(word));
}

// ------------------------------------------------------------
// JSON BODY
// ------------------------------------------------------------

async function readJSON(request) {
  const contentLength = Number(
    request.headers.get("Content-Length") || 0
  );

  if (contentLength > MAX_JSON_BODY) {
    throw new Error("Request body is too large");
  }

  const raw = await request.text();

  const bytes = new TextEncoder().encode(raw).byteLength;

  if (bytes > MAX_JSON_BODY) {
    throw new Error("Request body is too large");
  }

  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

// ------------------------------------------------------------
// CRYPTO
// ------------------------------------------------------------

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );
  }

  return bytes;
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return bytesToHex(new Uint8Array(hash));
}

async function hmacSHA256(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return bytesToHex(new Uint8Array(signature));
}

function safeEqual(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    a.length !== b.length
  ) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// ------------------------------------------------------------
// PASSWORD HASHING
// ------------------------------------------------------------

async function hashPassword(password) {
  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    key,
    256
  );

  return [
    "pbkdf2",
    PBKDF2_ITERATIONS,
    bytesToHex(salt),
    bytesToHex(new Uint8Array(bits))
  ].join("$");
}

async function verifyPassword(password, stored) {
  if (!stored) return false;

  const parts = String(stored).split("$");

  if (parts.length === 4 && parts[0] === "pbkdf2") {
    const iterations = Number(parts[1]);
    const saltHex = parts[2];
    const expected = parts[3];

    if (
      !Number.isInteger(iterations) ||
      iterations < 100000 ||
      !/^[0-9a-f]+$/i.test(saltHex) ||
      !/^[0-9a-f]+$/i.test(expected)
    ) {
      return false;
    }

    try {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
      );

      const bits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: hexToBytes(saltHex),
          iterations,
          hash: "SHA-256"
        },
        key,
        256
      );

      const actual = bytesToHex(
        new Uint8Array(bits)
      );

      return safeEqual(
        actual.toLowerCase(),
        expected.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  // Legacy SHA-256 password support.
  // Successful login will upgrade the password hash.
  if (/^[0-9a-f]{64}$/i.test(stored)) {
    const legacy = await sha256(password);
    return safeEqual(
      legacy.toLowerCase(),
      stored.toLowerCase()
    );
  }

  return false;
}

// ------------------------------------------------------------
// SESSION MANAGEMENT
// ------------------------------------------------------------

function sessionSecret(env) {
  return env.Session_secret || env.SESSION_SECRET || "";
}

function adminSecret(env) {
  return env.Admin_secret || env.ADMIN_SECRET || "";
}

async function createSession(db, user, env) {
  const secret = sessionSecret(env);

  if (!secret || secret.length < 32) {
    throw new Error(
      "Session_secret is missing or too short"
    );
  }

  if (user.role === "admin") {
    const admin = adminSecret(env);

    if (!admin || admin.length < 32) {
      throw new Error(
        "Admin_secret is missing or too short"
      );
    }
  }

  const token =
    crypto.randomUUID() +
    "." +
    crypto.randomUUID();

  const tokenHash = await hmacSHA256(
    user.role === "admin"
      ? secret + ":" + adminSecret(env)
      : secret,
    token
  );

  const expiresAt =
    Math.floor(Date.now() / 1000) +
    SESSION_DAYS * 24 * 60 * 60;

  await db
    .prepare(
      `INSERT INTO sessions
       (user_id, token_hash, role, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      user.id,
      tokenHash,
      user.role,
      expiresAt,
      Math.floor(Date.now() / 1000)
    )
    .run();

  return token;
}

async function authenticate(request, env) {
  const header =
    request.headers.get("Authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();

  if (
    !token ||
    token.length < 20 ||
    token.length > 300
  ) {
    return null;
  }

  const secret = sessionSecret(env);

  if (!secret || secret.length < 32) {
    return null;
  }

  const normalHash = await hmacSHA256(
    secret,
    token
  );

  const adminKey = adminSecret(env);

  let adminHash = null;

  if (adminKey && adminKey.length >= 32) {
    adminHash = await hmacSHA256(
      secret + ":" + adminKey,
      token
    );
  }

  const session = await env.DB
    .prepare(
      `SELECT
         s.id,
         s.user_id,
         s.role AS session_role,
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
       JOIN users u ON u.id=s.user_id
       WHERE
         (s.token_hash=? OR s.token_hash=?)
         AND s.expires_at>?
         AND u.is_active=1
       LIMIT 1`
    )
    .bind(
      normalHash,
      adminHash || "",
      Math.floor(Date.now() / 1000)
    )
    .first();

  if (!session) {
    return null;
  }

  return {
    session,
    user: {
      id: session.id,
      name: session.name,
      email: session.email,
      country: session.country,
      role: session.role,
      is_active: session.is_active,
      is_verified: session.is_verified,
      created_at: session.created_at
    },
    token
  };
}

async function requireAuth(request, env) {
  const auth = await authenticate(request, env);

  if (!auth) {
    return {
      error: errorResponse(
        "Authentication required",
        401,
        request,
        env
      )
    };
  }

  return auth;
}

async function requireAdmin(request, env) {
  const auth = await authenticate(request, env);

  if (!auth) {
    return {
      error: errorResponse(
        "Authentication required",
        401,
        request,
        env
      )
    };
  }

  if (auth.user.role !== "admin") {
    return {
      error: errorResponse(
        "Admin access required",
        403,
        request,
        env
      )
    };
  }

  return auth;
}

// ------------------------------------------------------------
// RATE LIMITING
// ------------------------------------------------------------

async function ensureRateLimitTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS rate_limits (
        rate_key TEXT PRIMARY KEY,
        window_start INTEGER NOT NULL,
        count INTEGER NOT NULL
      )`
    )
    .run();
}

async function rateLimit(
  db,
  key,
  max,
  windowSeconds
) {
  await ensureRateLimitTable(db);

  const now = Math.floor(Date.now() / 1000);

  const row = await db
    .prepare(
      `SELECT window_start, count
       FROM rate_limits
       WHERE rate_key=?`
    )
    .bind(key)
    .first();

  if (
    !row ||
    now - Number(row.window_start) >= windowSeconds
  ) {
    await db
      .prepare(
        `INSERT INTO rate_limits
         (rate_key, window_start, count)
         VALUES (?, ?, 1)
         ON CONFLICT(rate_key)
         DO UPDATE SET
           window_start=excluded.window_start,
           count=1`
      )
      .bind(key, now)
      .run();

    return {
      allowed: true,
      retryAfter: windowSeconds
    };
  }

  const count = Number(row.count || 0);

  if (count >= max) {
    return {
      allowed: false,
      retryAfter: Math.max(
        1,
        windowSeconds -
          (now - Number(row.window_start))
      )
    };
  }

  await db
    .prepare(
      `UPDATE rate_limits
       SET count=count+1
       WHERE rate_key=?`
    )
    .bind(key)
    .run();

  return {
    allowed: true,
    retryAfter: Math.max(
      1,
      windowSeconds -
        (now - Number(row.window_start))
    )
  };
}

// ------------------------------------------------------------
// SAFE USER
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// ROUTE HANDLER
// ------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      const path =
        url.pathname.replace(/\/+$/, "") || "/";

      const method = request.method.toUpperCase();

      // ------------------------------------------------------
      // CORS PREFLIGHT
      // ------------------------------------------------------

      if (method === "OPTIONS") {
        const origin = request.headers.get("Origin");

        if (
          origin &&
          !allowedOrigins(env).has(origin)
        ) {
          return new Response(null, {
            status: 403,
            headers: {
              ...API_SECURITY_HEADERS
            }
          });
        }

        return new Response(null, {
          status: 204,
          headers: {
            ...API_SECURITY_HEADERS,
            ...corsHeaders(request, env)
          }
        });
      }

      // ------------------------------------------------------
      // HEALTH
      // ------------------------------------------------------

      if (
        path === "/api/health" &&
        method === "GET"
      ) {
        return json(
          {
            ok: true,
            service: "IsokoHub API",
            environment: "production",
            platform: "cloudflare-workers",
            database: "D1",
            assets: "ASSETS",
            global: true,
            countries: COUNTRIES.length,
            service_categories:
              SERVICE_CATEGORIES.length,
            commission_rate: COMMISSION_RATE,
            time: new Date().toISOString()
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // CONFIG
      // ------------------------------------------------------

      if (
        path === "/api/config" &&
        method === "GET"
      ) {
        return json(
          {
            ok: true,
            environment: "production",
            platform: "cloudflare-workers",
            database: "D1",
            assets: "ASSETS",
            global: true,
            countries: COUNTRIES.length,
            service_categories:
              SERVICE_CATEGORIES.length,
            commission_rate: COMMISSION_RATE
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // COUNTRIES
      // ------------------------------------------------------

      if (
        path === "/api/countries" &&
        method === "GET"
      ) {
        return json(
          {
            countries: COUNTRIES
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // SERVICE CATEGORIES
      // ------------------------------------------------------

      if (
        path === "/api/service-categories" &&
        method === "GET"
      ) {
        return json(
          {
            categories:
              SERVICE_CATEGORIES
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // PRODUCT CATEGORIES
      // ------------------------------------------------------

      if (
        path === "/api/categories" &&
        method === "GET"
      ) {
        const rows = await env.DB
          .prepare(
            `SELECT *
             FROM categories
             WHERE COALESCE(is_active,1)=1
             ORDER BY name ASC`
          )
          .all();

        return json(
          {
            categories:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // REGISTER
      // ------------------------------------------------------

      if (
        path === "/api/register" &&
        method === "POST"
      ) {
        const ip = getIP(request);

        const ipLimit = await rateLimit(
          env.DB,
          "register:ip:" +
            await sha256(ip),
          5,
          60 * 60
        );

        if (!ipLimit.allowed) {
          return errorResponse(
            "Too many registration attempts. Try again later.",
            429,
            request,
            env,
            {
              "Retry-After":
                String(ipLimit.retryAfter)
            }
          );
        }

        const body = await readJSON(request);

        const name = cleanText(body.name, 120);
        const email = normalizeEmail(body.email);
        const password = String(
          body.password ?? ""
        );
        const country = cleanText(
          body.country,
          100
        );

        if (name.length < 2) {
          return errorResponse(
            "Name is required",
            400,
            request,
            env
          );
        }

        if (!validEmail(email)) {
          return errorResponse(
            "Valid email is required",
            400,
            request,
            env
          );
        }

        if (!validPassword(password)) {
          return errorResponse(
            "Password must be 8 to 128 characters",
            400,
            request,
            env
          );
        }

        if (!validCountry(country)) {
          return errorResponse(
            "Invalid country",
            400,
            request,
            env
          );
        }

        const existing = await env.DB
          .prepare(
            `SELECT id
             FROM users
             WHERE email=?
             LIMIT 1`
          )
          .bind(email)
          .first();

        if (existing) {
          return errorResponse(
            "Unable to create account with these details",
            409,
            request,
            env
          );
        }

        const passwordHash =
          await hashPassword(password);

        const now =
          Math.floor(Date.now() / 1000);

        try {
          await env.DB
            .prepare(
              `INSERT INTO users
               (name,email,password_hash,country,role,is_active,is_verified,created_at)
               VALUES (?,?,?,?,?,?,?,?)`
            )
            .bind(
              name,
              email,
              passwordHash,
              country,
              "buyer",
              1,
              0,
              now
            )
            .run();
        } catch {
          return errorResponse(
            "Unable to create account",
            400,
            request,
            env
          );
        }

        const user = await env.DB
          .prepare(
            `SELECT
              id,name,email,country,role,
              is_active,is_verified,created_at
             FROM users
             WHERE email=?
             LIMIT 1`
          )
          .bind(email)
          .first();

        const token =
          await createSession(
            env.DB,
            user,
            env
          );

        return json(
          {
            ok: true,
            token,
            user: safeUser(user)
          },
          201,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // LOGIN
      // ------------------------------------------------------

      if (
        path === "/api/login" &&
        method === "POST"
      ) {
        const ip = getIP(request);

        const ipLimit = await rateLimit(
          env.DB,
          "login:ip:" +
            await sha256(ip),
          20,
          15 * 60
        );

        if (!ipLimit.allowed) {
          return errorResponse(
            "Too many login attempts. Try again later.",
            429,
            request,
            env,
            {
              "Retry-After":
                String(ipLimit.retryAfter)
            }
          );
        }

        const body = await readJSON(request);

        const email = normalizeEmail(body.email);
        const password = String(
          body.password ?? ""
        );

        if (!validEmail(email)) {
          return errorResponse(
            "Invalid email or password",
            401,
            request,
            env
          );
        }

        if (!validPassword(password)) {
          return errorResponse(
            "Invalid email or password",
            401,
            request,
            env
          );
        }

        const emailLimit = await rateLimit(
          env.DB,
          "login:email:" +
            await sha256(email),
          8,
          15 * 60
        );

        if (!emailLimit.allowed) {
          return errorResponse(
            "Too many login attempts. Try again later.",
            429,
            request,
            env,
            {
              "Retry-After":
                String(emailLimit.retryAfter)
            }
          );
        }

        const user = await env.DB
          .prepare(
            `SELECT
              id,name,email,password_hash,country,
              role,is_active,is_verified,created_at
             FROM users
             WHERE email=?
             LIMIT 1`
          )
          .bind(email)
          .first();

        if (!user || !user.is_active) {
          return errorResponse(
            "Invalid email or password",
            401,
            request,
            env
          );
        }

        const passwordOK =
          await verifyPassword(
            password,
            user.password_hash
          );

        if (!passwordOK) {
          return errorResponse(
            "Invalid email or password",
            401,
            request,
            env
          );
        }

        // Upgrade legacy SHA-256 password hashes.
        if (
          /^[0-9a-f]{64}$/i.test(
            String(user.password_hash)
          )
        ) {
          const upgraded =
            await hashPassword(password);

          await env.DB
            .prepare(
              `UPDATE users
               SET password_hash=?
               WHERE id=?`
            )
            .bind(
              upgraded,
              user.id
            )
            .run();
        }

        // Clean expired sessions.
        await env.DB
          .prepare(
            `DELETE FROM sessions
             WHERE expires_at<?`
          )
          .bind(
            Math.floor(Date.now() / 1000)
          )
          .run();

        const token =
          await createSession(
            env.DB,
            user,
            env
          );

        return json(
          {
            ok: true,
            token,
            user: safeUser(user)
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // AUTHENTICATED ROUTES
      // ------------------------------------------------------

      if (
        path === "/api/me" &&
        method === "GET"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        return json(
          {
            user: safeUser(auth.user)
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // LOGOUT
      // ------------------------------------------------------

      if (
        path === "/api/logout" &&
        method === "POST"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const secret =
          sessionSecret(env);

        const normalHash =
          await hmacSHA256(
            secret,
            auth.token
          );

        const adminKey =
          adminSecret(env);

        let adminHash = "";

        if (
          adminKey &&
          adminKey.length >= 32
        ) {
          adminHash =
            await hmacSHA256(
              secret + ":" + adminKey,
              auth.token
            );
        }

        await env.DB
          .prepare(
            `DELETE FROM sessions
             WHERE token_hash=? OR token_hash=?`
          )
          .bind(
            normalHash,
            adminHash
          )
          .run();

        return json(
          {
            ok: true
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // PRODUCTS — GET
      // ------------------------------------------------------

      if (
        path === "/api/products" &&
        method === "GET"
      ) {
        const search = cleanText(
          url.searchParams.get("search"),
          100
        );

        const category = cleanText(
          url.searchParams.get("category"),
          120
        );

        const country = cleanText(
          url.searchParams.get("country"),
          100
        );

        const sellerId = integerValue(
          url.searchParams.get("seller_id"),
          0
        );

        const limit = limitValue(
          url.searchParams.get("limit"),
          100,
          500
        );

        const params = [];
        const conditions = [
          "p.status='active'"
        ];

        if (search) {
          conditions.push(`
            (
              p.title LIKE ?
              OR p.category LIKE ?
              OR p.description LIKE ?
              OR p.specs LIKE ?
              OR p.country LIKE ?
              OR p.district LIKE ?
            )
          `);

          const q = `%${search}%`;

          params.push(
            q,q,q,q,q,q
          );
        }

        if (category) {
          conditions.push(
            "p.category=?"
          );
          params.push(category);
        }

        if (country) {
          conditions.push(
            "p.country=?"
          );
          params.push(country);
        }

        if (sellerId > 0) {
          conditions.push(
            "p.seller_id=?"
          );
          params.push(sellerId);
        }

        const sql = `
          SELECT
            p.*,
            u.name AS seller_name,
            u.email AS seller_email
          FROM products p
          LEFT JOIN users u
            ON u.id=p.seller_id
          WHERE ${conditions.join(" AND ")}
          ORDER BY p.created_at DESC
          LIMIT ?
        `;

        params.push(limit);

        const rows =
          await env.DB
            .prepare(sql)
            .bind(...params)
            .all();

        const list =
          (rows.results || []).map(
            p => ({
              ...p,
              seller:
                p.seller_name ||
                "IsokoHub Seller"
            })
          );

        return json(
          {
            products: list,
            count: list.length
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // PRODUCT — SINGLE
      // ------------------------------------------------------

      const productMatch =
        path.match(
          /^\/api\/products\/(\d+)$/
        );

      if (
        productMatch &&
        method === "GET"
      ) {
        const id =
          Number(productMatch[1]);

        const product =
          await env.DB
            .prepare(
              `SELECT
                p.*,
                u.name AS seller_name,
                u.email AS seller_email
               FROM products p
               LEFT JOIN users u
                 ON u.id=p.seller_id
               WHERE p.id=?
               LIMIT 1`
            )
            .bind(id)
            .first();

        if (!product) {
          return errorResponse(
            "Product not found",
            404,
            request,
            env
          );
        }

        await env.DB
          .prepare(
            `UPDATE products
             SET views=COALESCE(views,0)+1
             WHERE id=?`
          )
          .bind(id)
          .run();

        product.views =
          Number(product.views || 0) + 1;

        product.seller =
          product.seller_name ||
          "IsokoHub Seller";

        return json(
          {
            product
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // SERVICES SEARCH
      // ------------------------------------------------------

      if (
        path === "/api/services" &&
        method === "GET"
      ) {
        const search = cleanText(
          url.searchParams.get("search"),
          100
        );

        const category = cleanText(
          url.searchParams.get("category"),
          120
        );

        const country = cleanText(
          url.searchParams.get("country"),
          100
        );

        const city = cleanText(
          url.searchParams.get("city") ||
          url.searchParams.get("district"),
          120
        );

        const provider = cleanText(
          url.searchParams.get("provider"),
          120
        );

        const online =
          url.searchParams.get("online");

        const limit = limitValue(
          url.searchParams.get("limit"),
          100,
          500
        );

        const params = [];
        const conditions = [
          "p.status='active'"
        ];

        if (category) {
          conditions.push(
            "p.category=?"
          );
          params.push(category);
        }

        if (country) {
          conditions.push(
            "p.country=?"
          );
          params.push(country);
        }

        if (city) {
          conditions.push(`
            (
              p.city LIKE ?
              OR p.district LIKE ?
            )
          `);

          const q = `%${city}%`;

          params.push(q,q);
        }

        if (provider) {
          conditions.push(
            "u.name LIKE ?"
          );
          params.push(
            `%${provider}%`
          );
        }

        const rows =
          await env.DB
            .prepare(
              `
              SELECT
                p.*,
                u.name AS seller_name,
                u.email AS seller_email
              FROM products p
              LEFT JOIN users u
                ON u.id=p.seller_id
              WHERE ${conditions.join(" AND ")}
              ORDER BY p.created_at DESC
              LIMIT ?
              `
            )
            .bind(
              ...params,
              Math.min(500, limit * 3)
            )
            .all();

        let services =
          (rows.results || [])
            .filter(isServiceProduct);

        if (search) {
          const q =
            search.toLowerCase();

          services =
            services.filter(
              p =>
                productText(p)
                  .includes(q)
            );
        }

        if (
          online === "true" ||
          online === "1"
        ) {
          services =
            services.filter(
              p =>
                /online|remote|virtual/i.test(
                  productText(p)
                )
            );
        }

        services =
          services
            .slice(0, limit)
            .map(p => ({
              ...p,
              seller:
                p.seller_name ||
                "IsokoHub Provider"
            }));

        return json(
          {
            services,
            count: services.length
          },
          200,
          request,
          env
        );
      }

      if (
        path === "/api/service-search" &&
        method === "GET"
      ) {
        const target =
          new URL(request.url);

        target.pathname =
          "/api/services";

        return this.fetch(
          new Request(target.toString(), {
            method: "GET",
            headers: request.headers
          }),
          env,
          ctx
        );
      }

      // ------------------------------------------------------
      // CREATE PRODUCT
      // ------------------------------------------------------

      if (
        path === "/api/products" &&
        method === "POST"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const body =
          await readJSON(request);

        const title =
          cleanText(body.title, 200);

        const category =
          cleanText(
            body.category,
            120
          );

        const price =
          numberValue(body.price, -1);

        const currency =
          cleanText(
            body.currency || "RWF",
            3
          ).toUpperCase();

        const stock =
          integerValue(
            body.stock,
            -1
          );

        const condition =
          cleanText(
            body.condition || "new",
            40
          );

        const country =
          cleanText(
            body.country,
            100
          );

        const district =
          cleanText(
            body.district ||
            body.city ||
            "",
            120
          );

        const imageUrl =
          cleanText(
            body.image_url || "",
            2048
          );

        const description =
          cleanText(
            body.description ||
            body.specs ||
            "",
            10000
          );

        if (title.length < 2) {
          return errorResponse(
            "Product title is required",
            400,
            request,
            env
          );
        }

        if (!category) {
          return errorResponse(
            "Category is required",
            400,
            request,
            env
          );
        }

        if (
          !Number.isFinite(price) ||
          price < 0 ||
          price > 100000000000
        ) {
          return errorResponse(
            "Invalid price",
            400,
            request,
            env
          );
        }

        if (!validCurrency(currency)) {
          return errorResponse(
            "Currency must be a 3-letter code",
            400,
            request,
            env
          );
        }

        if (
          stock < 0 ||
          stock > 1000000
        ) {
          return errorResponse(
            "Invalid stock",
            400,
            request,
            env
          );
        }

        if (!validCountry(country)) {
          return errorResponse(
            "Invalid country",
            400,
            request,
            env
          );
        }

        if (
          ![
            "new",
            "used",
            "refurbished",
            "service",
            "digital"
          ].includes(condition)
        ) {
          return errorResponse(
            "Invalid condition",
            400,
            request,
            env
          );
        }

        if (!validURL(imageUrl)) {
          return errorResponse(
            "Image URL must use HTTP or HTTPS",
            400,
            request,
            env
          );
        }

        const now =
          Math.floor(Date.now() / 1000);

        await env.DB
          .prepare(
            `INSERT INTO products
             (
               seller_id,
               title,
               category,
               price,
               currency,
               stock,
               condition,
               country,
               district,
               image_url,
               description,
               specs,
               status,
               views,
               created_at,
               updated_at
             )
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
          )
          .bind(
            auth.user.id,
            title,
            category,
            price,
            currency,
            stock,
            condition,
            country,
            district,
            imageUrl,
            description,
            description,
            "active",
            0,
            now,
            now
          )
          .run();

        const product =
          await env.DB
            .prepare(
              `SELECT *
               FROM products
               WHERE seller_id=?
               ORDER BY id DESC
               LIMIT 1`
            )
            .bind(auth.user.id)
            .first();

        return json(
          {
            ok: true,
            product
          },
          201,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // UPDATE PRODUCT
      // ------------------------------------------------------

      if (
        productMatch &&
        method === "PUT"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const id =
          Number(productMatch[1]);

        const product =
          await env.DB
            .prepare(
              `SELECT *
               FROM products
               WHERE id=?
               LIMIT 1`
            )
            .bind(id)
            .first();

        if (!product) {
          return errorResponse(
            "Product not found",
            404,
            request,
            env
          );
        }

        if (
          product.seller_id !== auth.user.id &&
          auth.user.role !== "admin"
        ) {
          return errorResponse(
            "Not allowed",
            403,
            request,
            env
          );
        }

        const body =
          await readJSON(request);

        const title =
          cleanText(
            body.title ?? product.title,
            200
          );

        const category =
          cleanText(
            body.category ?? product.category,
            120
          );

        const price =
          numberValue(
            body.price ?? product.price,
            -1
          );

        const currency =
          cleanText(
            body.currency ||
            product.currency ||
            "RWF",
            3
          ).toUpperCase();

        const stock =
          integerValue(
            body.stock ??
            product.stock,
            -1
          );

        const country =
          cleanText(
            body.country ??
            product.country,
            100
          );

        const district =
          cleanText(
            body.district ??
            product.district ??
            "",
            120
          );

        const imageUrl =
          cleanText(
            body.image_url ??
            product.image_url ??
            "",
            2048
          );

        const description =
          cleanText(
            body.description ??
            product.description ??
            product.specs ??
            "",
            10000
          );

        if (
          title.length < 2 ||
          !category ||
          price < 0 ||
          stock < 0 ||
          !validCurrency(currency) ||
          !validCountry(country) ||
          !validURL(imageUrl)
        ) {
          return errorResponse(
            "Invalid product data",
            400,
            request,
            env
          );
        }

        await env.DB
          .prepare(
            `UPDATE products
             SET
               title=?,
               category=?,
               price=?,
               currency=?,
               stock=?,
               country=?,
               district=?,
               image_url=?,
               description=?,
               specs=?,
               updated_at=?
             WHERE id=?`
          )
          .bind(
            title,
            category,
            price,
            currency,
            stock,
            country,
            district,
            imageUrl,
            description,
            description,
            Math.floor(
              Date.now() / 1000
            ),
            id
          )
          .run();

        return json(
          {
            ok: true
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // DELETE PRODUCT
      // ------------------------------------------------------

      if (
        productMatch &&
        method === "DELETE"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const id =
          Number(productMatch[1]);

        const product =
          await env.DB
            .prepare(
              `SELECT seller_id
               FROM products
               WHERE id=?
               LIMIT 1`
            )
            .bind(id)
            .first();

        if (!product) {
          return errorResponse(
            "Product not found",
            404,
            request,
            env
          );
        }

        if (
          product.seller_id !== auth.user.id &&
          auth.user.role !== "admin"
        ) {
          return errorResponse(
            "Not allowed",
            403,
            request,
            env
          );
        }

        await env.DB
          .prepare(
            `UPDATE products
             SET status='inactive',
                 updated_at=?
             WHERE id=?`
          )
          .bind(
            Math.floor(
              Date.now() / 1000
            ),
            id
          )
          .run();

        return json(
          {
            ok: true
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // SAVED
      // ------------------------------------------------------

      if (
        path === "/api/saved" &&
        method === "GET"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                s.id AS saved_id,
                p.*
               FROM saved s
               JOIN products p
                 ON p.id=s.product_id
               WHERE
                 s.user_id=?
                 AND p.status='active'
               ORDER BY s.created_at DESC`
            )
            .bind(auth.user.id)
            .all();

        return json(
          {
            saved:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      const savedMatch =
        path.match(
          /^\/api\/saved\/(\d+)$/
        );

      if (
        savedMatch &&
        method === "POST"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const productId =
          Number(savedMatch[1]);

        const product =
          await env.DB
            .prepare(
              `SELECT id
               FROM products
               WHERE id=? AND status='active'
               LIMIT 1`
            )
            .bind(productId)
            .first();

        if (!product) {
          return errorResponse(
            "Product not found",
            404,
            request,
            env
          );
        }

        await env.DB
          .prepare(
            `INSERT OR IGNORE INTO saved
             (user_id,product_id,created_at)
             VALUES (?,?,?)`
          )
          .bind(
            auth.user.id,
            productId,
            Math.floor(
              Date.now() / 1000
            )
          )
          .run();

        return json(
          { ok: true },
          200,
          request,
          env
        );
      }

      if (
        savedMatch &&
        method === "DELETE"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const productId =
          Number(savedMatch[1]);

        await env.DB
          .prepare(
            `DELETE FROM saved
             WHERE user_id=? AND product_id=?`
          )
          .bind(
            auth.user.id,
            productId
          )
          .run();

        return json(
          { ok: true },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ORDERS — GET
      // ------------------------------------------------------

      if (
        path === "/api/orders" &&
        method === "GET"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                o.*,
                p.title,
                p.image_url,
                p.currency,
                u.name AS seller_name
               FROM orders o
               LEFT JOIN products p
                 ON p.id=o.product_id
               LEFT JOIN users u
                 ON u.id=o.seller_id
               WHERE o.buyer_id=?
               ORDER BY o.created_at DESC
               LIMIT 500`
            )
            .bind(auth.user.id)
            .all();

        const orders =
          (rows.results || []).map(o => ({
            ...o,
            total:
              o.total_price,
            total_amount:
              o.total_price,
            total_price:
              o.total_price
          }));

        return json(
          {
            orders
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // CREATE ORDER
      // ------------------------------------------------------

      if (
        path === "/api/orders" &&
        method === "POST"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const body =
          await readJSON(request);

        const productId =
          integerValue(
            body.product_id,
            0
          );

        const quantity =
          integerValue(
            body.quantity,
            0
          );

        if (
          productId <= 0 ||
          quantity < 1 ||
          quantity > 1000
        ) {
          return errorResponse(
            "Invalid order",
            400,
            request,
            env
          );
        }

        const product =
          await env.DB
            .prepare(
              `SELECT *
               FROM products
               WHERE id=?
                 AND status='active'
               LIMIT 1`
            )
            .bind(productId)
            .first();

        if (!product) {
          return errorResponse(
            "Product not found",
            404,
            request,
            env
          );
        }

        if (
          product.seller_id ===
          auth.user.id
        ) {
          return errorResponse(
            "You cannot order your own listing",
            400,
            request,
            env
          );
        }

        if (
          Number(product.stock) <
          quantity
        ) {
          return errorResponse(
            "Not enough stock",
            409,
            request,
            env
          );
        }

        const total =
          Number(product.price) *
          quantity;

        const commission =
          Math.round(
            total *
            COMMISSION_RATE *
            100
          ) / 100;

        const now =
          Math.floor(
            Date.now() / 1000
          );

        const update =
          await env.DB
            .prepare(
              `UPDATE products
               SET stock=stock-?,
                   updated_at=?
               WHERE id=?
                 AND status='active'
                 AND stock>=?`
            )
            .bind(
              quantity,
              now,
              productId,
              quantity
            )
            .run();

        if (
          !update.meta ||
          Number(update.meta.changes) !== 1
        ) {
          return errorResponse(
            "Stock changed. Please try again.",
            409,
            request,
            env
          );
        }

        try {
          await env.DB
            .prepare(
              `INSERT INTO orders
               (
                 buyer_id,
                 seller_id,
                 product_id,
                 quantity,
                 unit_price,
                 total_price,
                 currency,
                 commission,
                 status,
                 payment_status,
                 created_at,
                 updated_at
               )
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
            )
            .bind(
              auth.user.id,
              product.seller_id,
              productId,
              quantity,
              product.price,
              total,
              product.currency,
              commission,
              "pending",
              "unpaid",
              now,
              now
            )
            .run();
        } catch {
          await env.DB
            .prepare(
              `UPDATE products
               SET stock=stock+?,
                   updated_at=?
               WHERE id=?`
            )
            .bind(
              quantity,
              now,
              productId
            )
            .run();

          throw new Error(
            "Could not create order"
          );
        }

        return json(
          {
            ok: true,
            total_price: total,
            commission,
            payment_status: "unpaid",
            status: "pending"
          },
          201,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // MESSAGES
      // ------------------------------------------------------

      if (
        path === "/api/messages" &&
        method === "GET"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                m.*,
                s.name AS sender_name,
                r.name AS receiver_name
               FROM messages m
               LEFT JOIN users s
                 ON s.id=m.sender_id
               LEFT JOIN users r
                 ON r.id=m.receiver_id
               WHERE
                 m.sender_id=?
                 OR m.receiver_id=?
               ORDER BY m.created_at DESC
               LIMIT 500`
            )
            .bind(
              auth.user.id,
              auth.user.id
            )
            .all();

        return json(
          {
            messages:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      if (
        path === "/api/messages" &&
        method === "POST"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const body =
          await readJSON(request);

        const receiverId =
          integerValue(
            body.receiver_id,
            0
          );

        const message =
          cleanText(
            body.body,
            5000
          );

        if (
          receiverId <= 0 ||
          !message
        ) {
          return errorResponse(
            "Receiver and message are required",
            400,
            request,
            env
          );
        }

        if (
          receiverId === auth.user.id
        ) {
          return errorResponse(
            "You cannot message yourself",
            400,
            request,
            env
          );
        }

        const receiver =
          await env.DB
            .prepare(
              `SELECT id
               FROM users
               WHERE id=? AND is_active=1
               LIMIT 1`
            )
            .bind(receiverId)
            .first();

        if (!receiver) {
          return errorResponse(
            "Receiver not found",
            404,
            request,
            env
          );
        }

        await env.DB
          .prepare(
            `INSERT INTO messages
             (sender_id,receiver_id,body,is_read,created_at)
             VALUES (?,?,?,?,?)`
          )
          .bind(
            auth.user.id,
            receiverId,
            message,
            0,
            Math.floor(
              Date.now() / 1000
            )
          )
          .run();

        return json(
          {
            ok: true
          },
          201,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // SELLER PRODUCTS
      // ------------------------------------------------------

      if (
        path === "/api/seller/products" &&
        method === "GET"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT *
               FROM products
               WHERE seller_id=?
               ORDER BY created_at DESC
               LIMIT 500`
            )
            .bind(auth.user.id)
            .all();

        return json(
          {
            products:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // SELLER STATS
      // ------------------------------------------------------

      if (
        path === "/api/seller/stats" &&
        method === "GET"
      ) {
        const auth =
          await requireAuth(
            request,
            env
          );

        if (auth.error) return auth.error;

        const products =
          await env.DB
            .prepare(
              `SELECT COUNT(*) AS count
               FROM products
               WHERE seller_id=?`
            )
            .bind(auth.user.id)
            .first();

        const orders =
          await env.DB
            .prepare(
              `SELECT
                COUNT(*) AS count,
                COALESCE(SUM(total_price),0) AS revenue,
                COALESCE(SUM(commission),0) AS commission
               FROM orders
               WHERE seller_id=?
                 AND payment_status='paid'`
            )
            .bind(auth.user.id)
            .first();

        return json(
          {
            products:
              Number(products?.count || 0),
            orders:
              Number(orders?.count || 0),
            revenue:
              Number(orders?.revenue || 0),
            commission:
              Number(orders?.commission || 0)
          },
          200,
          request,
          env
        );
      }

      // ======================================================
      // ADMIN
      // ======================================================

      // ------------------------------------------------------
      // ADMIN OVERVIEW
      // ------------------------------------------------------

      if (
        path === "/api/admin/stats" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const users =
          await env.DB
            .prepare(
              `SELECT COUNT(*) AS count
               FROM users`
            )
            .first();

        const sellers =
          await env.DB
            .prepare(
              `SELECT COUNT(*) AS count
               FROM users
               WHERE role='seller'`
            )
            .first();

        const products =
          await env.DB
            .prepare(
              `SELECT COUNT(*) AS count
               FROM products`
            )
            .first();

        const orders =
          await env.DB
            .prepare(
              `SELECT COUNT(*) AS count
               FROM orders`
            )
            .first();

        const money =
          await env.DB
            .prepare(
              `SELECT
                COALESCE(
                  SUM(
                    CASE
                      WHEN payment_status='paid'
                      THEN total_price
                      ELSE 0
                    END
                  ),0
                ) AS revenue,
                COALESCE(
                  SUM(
                    CASE
                      WHEN payment_status='paid'
                      THEN commission
                      ELSE 0
                    END
                  ),0
                ) AS commission
               FROM orders`
            )
            .first();

        return json(
          {
            users:
              Number(users?.count || 0),
            sellers:
              Number(sellers?.count || 0),
            products:
              Number(products?.count || 0),
            orders:
              Number(orders?.count || 0),
            revenue:
              Number(money?.revenue || 0),
            commission:
              Number(money?.commission || 0)
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN USERS
      // ------------------------------------------------------

      if (
        path === "/api/admin/users" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                id,name,email,country,role,
                is_active,is_verified,created_at
               FROM users
               ORDER BY created_at DESC
               LIMIT 500`
            )
            .all();

        return json(
          {
            users:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN SELLERS
      // ------------------------------------------------------

      if (
        path === "/api/admin/sellers" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                u.id,
                u.name,
                u.email,
                u.country,
                u.role,
                u.is_active,
                COUNT(p.id) AS products
               FROM users u
               LEFT JOIN products p
                 ON p.seller_id=u.id
               WHERE u.role IN ('seller','admin')
               GROUP BY u.id
               ORDER BY u.created_at DESC
               LIMIT 500`
            )
            .all();

        return json(
          {
            sellers:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN PRODUCTS
      // ------------------------------------------------------

      if (
        path === "/api/admin/products" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                p.*,
                u.name AS seller_name
               FROM products p
               LEFT JOIN users u
                 ON u.id=p.seller_id
               ORDER BY p.created_at DESC
               LIMIT 500`
            )
            .all();

        return json(
          {
            products:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN ORDERS
      // ------------------------------------------------------

      if (
        path === "/api/admin/orders" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                o.*,
                p.title,
                b.name AS buyer_name,
                s.name AS seller_name
               FROM orders o
               LEFT JOIN products p
                 ON p.id=o.product_id
               LEFT JOIN users b
                 ON b.id=o.buyer_id
               LEFT JOIN users s
                 ON s.id=o.seller_id
               ORDER BY o.created_at DESC
               LIMIT 500`
            )
            .all();

        return json(
          {
            orders:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN PAYMENTS
      // ------------------------------------------------------

      if (
        path === "/api/admin/payments" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                o.id,
                o.buyer_id,
                o.seller_id,
                o.product_id,
                o.total_price,
                o.currency,
                o.commission,
                o.payment_status,
                o.created_at
               FROM orders o
               ORDER BY o.created_at DESC
               LIMIT 500`
            )
            .all();

        return json(
          {
            payments:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN SERVICES
      // ------------------------------------------------------

      if (
        path === "/api/admin/services" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT
                p.*,
                u.name AS seller_name
               FROM products p
               LEFT JOIN users u
                 ON u.id=p.seller_id
               WHERE p.status='active'
               ORDER BY p.created_at DESC
               LIMIT 500`
            )
            .all();

        const services =
          (rows.results || [])
            .filter(isServiceProduct);

        return json(
          {
            services
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN CATEGORIES
      // ------------------------------------------------------

      if (
        path === "/api/admin/categories" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const rows =
          await env.DB
            .prepare(
              `SELECT *
               FROM categories
               ORDER BY name ASC
               LIMIT 500`
            )
            .all();

        return json(
          {
            categories:
              rows.results || []
          },
          200,
          request,
          env
        );
      }

      if (
        path === "/api/admin/categories" &&
        method === "POST"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const body =
          await readJSON(request);

        const name =
          cleanText(
            body.name,
            120
          );

        if (!name) {
          return errorResponse(
            "Category name is required",
            400,
            request,
            env
          );
        }

        await env.DB
          .prepare(
            `INSERT INTO categories
             (name,is_active,created_at)
             VALUES (?,?,?)`
          )
          .bind(
            name,
            1,
            Math.floor(
              Date.now() / 1000
            )
          )
          .run();

        return json(
          {
            ok: true
          },
          201,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN REPORTS
      // ------------------------------------------------------

      if (
        path === "/api/admin/reports" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const daily =
          await env.DB
            .prepare(
              `SELECT
                DATE(
                  datetime(created_at,'unixepoch')
                ) AS day,
                COUNT(*) AS orders,
                COALESCE(
                  SUM(total_price),0
                ) AS revenue
               FROM orders
               GROUP BY day
               ORDER BY day DESC
               LIMIT 90`
            )
            .all();

        return json(
          {
            reports:
              daily.results || []
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN REVIEWS
      // ------------------------------------------------------

      if (
        path === "/api/admin/reviews" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        try {
          const rows =
            await env.DB
              .prepare(
                `SELECT *
                 FROM reviews
                 ORDER BY created_at DESC
                 LIMIT 500`
              )
              .all();

          return json(
            {
              reviews:
                rows.results || []
            },
            200,
            request,
            env
          );
        } catch {
          return json(
            {
              reviews: [],
              message:
                "Reviews table is not enabled yet"
            },
            200,
            request,
            env
          );
        }
      }

      // ------------------------------------------------------
      // ADMIN PROMOTIONS
      // ------------------------------------------------------

      if (
        path === "/api/admin/promotions" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        try {
          const rows =
            await env.DB
              .prepare(
                `SELECT *
                 FROM promotions
                 ORDER BY created_at DESC
                 LIMIT 500`
              )
              .all();

          return json(
            {
              promotions:
                rows.results || []
            },
            200,
            request,
            env
          );
        } catch {
          return json(
            {
              promotions: [],
              message:
                "Promotions table is not enabled yet"
            },
            200,
            request,
            env
          );
        }
      }

      // ------------------------------------------------------
      // ADMIN ADS
      // ------------------------------------------------------

      if (
        path === "/api/admin/ads" &&
        method === "GET"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        try {
          const rows =
            await env.DB
              .prepare(
                `SELECT *
                 FROM ads
                 ORDER BY created_at DESC
                 LIMIT 500`
              )
              .all();

          return json(
            {
              ads:
                rows.results || []
            },
            200,
            request,
            env
          );
        } catch {
          return json(
            {
              ads: [],
              message:
                "Ads table is not enabled yet"
            },
            200,
            request,
            env
          );
        }
      }

      // ------------------------------------------------------
      // ADMIN UPDATE ORDER
      // ------------------------------------------------------

      const adminOrderMatch =
        path.match(
          /^\/api\/admin\/orders\/(\d+)$/
        );

      if (
        adminOrderMatch &&
        method === "PATCH"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const id =
          Number(adminOrderMatch[1]);

        const body =
          await readJSON(request);

        const allowedStatus = [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "completed",
          "cancelled"
        ];

        const allowedPayment = [
          "unpaid",
          "pending",
          "paid",
          "failed",
          "refunded"
        ];

        const current =
          await env.DB
            .prepare(
              `SELECT *
               FROM orders
               WHERE id=?
               LIMIT 1`
            )
            .bind(id)
            .first();

        if (!current) {
          return errorResponse(
            "Order not found",
            404,
            request,
            env
          );
        }

        const status =
          body.status !== undefined
            ? cleanText(
                body.status,
                30
              )
            : current.status;

        const paymentStatus =
          body.payment_status !==
          undefined
            ? cleanText(
                body.payment_status,
                30
              )
            : current.payment_status;

        if (
          !allowedStatus.includes(
            status
          ) ||
          !allowedPayment.includes(
            paymentStatus
          )
        ) {
          return errorResponse(
            "Invalid order status",
            400,
            request,
            env
          );
        }

        await env.DB
          .prepare(
            `UPDATE orders
             SET
               status=?,
               payment_status=?,
               updated_at=?
             WHERE id=?`
          )
          .bind(
            status,
            paymentStatus,
            Math.floor(
              Date.now() / 1000
            ),
            id
          )
          .run();

        return json(
          {
            ok: true
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN UPDATE USER
      // ------------------------------------------------------

      const adminUserMatch =
        path.match(
          /^\/api\/admin\/users\/(\d+)$/
        );

      if (
        adminUserMatch &&
        method === "PATCH"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const id =
          Number(adminUserMatch[1]);

        if (
          id === auth.user.id
        ) {
          return errorResponse(
            "You cannot modify your own admin status here",
            400,
            request,
            env
          );
        }

        const body =
          await readJSON(request);

        const target =
          await env.DB
            .prepare(
              `SELECT *
               FROM users
               WHERE id=?
               LIMIT 1`
            )
            .bind(id)
            .first();

        if (!target) {
          return errorResponse(
            "User not found",
            404,
            request,
            env
          );
        }

        let role =
          target.role;

        let isActive =
          Number(target.is_active);

        let isVerified =
          Number(target.is_verified);

        if (body.role !== undefined) {
          const requestedRole =
            cleanText(
              body.role,
              20
            );

          if (
            ![
              "buyer",
              "seller",
              "admin"
            ].includes(
              requestedRole
            )
          ) {
            return errorResponse(
              "Invalid role",
              400,
              request,
              env
            );
          }

          role =
            requestedRole;
        }

        if (
          body.is_active !== undefined
        ) {
          isActive =
            body.is_active ? 1 : 0;
        }

        if (
          body.is_verified !== undefined
        ) {
          isVerified =
            body.is_verified ? 1 : 0;
        }

        // Prevent removing the last active admin.
        if (
          target.role === "admin" &&
          (
            role !== "admin" ||
            isActive !== 1
          )
        ) {
          const admins =
            await env.DB
              .prepare(
                `SELECT COUNT(*) AS count
                 FROM users
                 WHERE role='admin'
                   AND is_active=1`
              )
              .first();

          if (
            Number(admins?.count || 0) <= 1
          ) {
            return errorResponse(
              "The last active admin cannot be removed or disabled",
              400,
              request,
              env
            );
          }
        }

        await env.DB
          .prepare(
            `UPDATE users
             SET
               role=?,
               is_active=?,
               is_verified=?
             WHERE id=?`
          )
          .bind(
            role,
            isActive,
            isVerified,
            id
          )
          .run();

        // Role/status changes immediately invalidate sessions.
        await env.DB
          .prepare(
            `DELETE FROM sessions
             WHERE user_id=?`
          )
          .bind(id)
          .run();

        return json(
          {
            ok: true
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // ADMIN UPDATE PRODUCT
      // ------------------------------------------------------

      const adminProductMatch =
        path.match(
          /^\/api\/admin\/products\/(\d+)$/
        );

      if (
        adminProductMatch &&
        method === "PATCH"
      ) {
        const auth =
          await requireAdmin(
            request,
            env
          );

        if (auth.error) return auth.error;

        const id =
          Number(adminProductMatch[1]);

        const body =
          await readJSON(request);

        const allowedStatuses = [
          "active",
          "inactive",
          "sold",
          "draft",
          "blocked"
        ];

        const status =
          cleanText(
            body.status,
            30
          );

        if (
          !allowedStatuses.includes(
            status
          )
        ) {
          return errorResponse(
            "Invalid product status",
            400,
            request,
            env
          );
        }

        await env.DB
          .prepare(
            `UPDATE products
             SET
               status=?,
               updated_at=?
             WHERE id=?`
          )
          .bind(
            status,
            Math.floor(
              Date.now() / 1000
            ),
            id
          )
          .run();

        return json(
          {
            ok: true
          },
          200,
          request,
          env
        );
      }

      // ------------------------------------------------------
      // STATIC ASSETS / FRONTEND
      // ------------------------------------------------------

      if (
        env.ASSETS &&
        typeof env.ASSETS.fetch === "function"
      ) {
        const assetResponse =
          await env.ASSETS.fetch(
            request
          );

        const headers =
          new Headers(
            assetResponse.headers
          );

        for (
          const [key, value]
          of Object.entries(
            STATIC_SECURITY_HEADERS
          )
        ) {
          headers.set(
            key,
            value
          );
        }

        return new Response(
          assetResponse.body,
          {
            status:
              assetResponse.status,
            statusText:
              assetResponse.statusText,
            headers
          }
        );
      }

      return errorResponse(
        "Route not found",
        404,
        request,
        env
      );

    } catch (error) {
      console.error(
        "IsokoHub Worker Error:",
        error?.message || error
      );

      return errorResponse(
        error?.message ===
          "Request body is too large"
          ? "Request body is too large"
          : "Internal server error",
        error?.message ===
          "Request body is too large"
          ? 413
          : 500,
        request,
        env
      );
    }
  }
};
