// ============================================================
// IsokoHub — FINAL Cloudflare Worker API
// Global Marketplace & Services
// Domain: isokohub.online
// D1 + R2
// PBKDF2 passwords + HMAC sessions + validation
// ============================================================

const COMMISSION_RATE = 0.05;
const PBKDF2_ITERATIONS = 150000;
const MAX_JSON_BODY = 1024 * 1024;
const SESSION_DAYS = 30;
const MAX_NAME = 100;
const MAX_TEXT = 10000;
const MAX_TITLE = 200;
const MAX_PRICE = 100000000000;
const MAX_STOCK = 1000000;

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
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas",
  "Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin",
  "Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei",
  "Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon",
  "Canada","Central African Republic","Chad","Chile","China","Colombia",
  "Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Democratic Republic of the Congo","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea",
  "Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati",
  "Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania",
  "Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia",
  "Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines",
  "Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines",
  "Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal",
  "Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan",
  "Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo",
  "Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam",
  "Yemen","Zambia","Zimbabwe"
];

// ============================================================
// CORS
// ============================================================

const ALLOWED_ORIGINS = [
  "https://isokohub.online",
  "https://www.isokohub.online",
  "https://api.isokohub.online",
  "https://isokohub-rw.pages.dev",
  "https://isokohub-rwr.majyamberepierre00.workers.dev"
];

function corsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";

  const allowOrigin =
    ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "https://isokohub.online";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods":
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status = 200, request = null) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        ...corsHeaders(request)
      }
    }
  );
}

function securityHeaders(request) {
  const headers = new Headers(
    corsHeaders(request)
  );

  headers.set(
    "X-Content-Type-Options",
    "nosniff"
  );

  headers.set(
    "X-Frame-Options",
    "DENY"
  );

  headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return headers;
}

// ============================================================
// HELPERS
// ============================================================

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function cleanText(value, max = MAX_TEXT) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function normalizeEmail(value) {
  return cleanText(value, 254).toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPassword(value) {
  return typeof value === "string" &&
    value.length >= 8 &&
    value.length <= 200;
}

function validCountry(value) {
  return !value || COUNTRIES.includes(value);
}

function validCurrency(value) {
  return /^[A-Z]{3}$/.test(value);
}

function validURL(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ||
      url.protocol === "http:";
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

function limitValue(value, fallback = 100) {
  return Math.min(
    Math.max(integerValue(value, fallback), 1),
    500
  );
}

function makeToken() {
  return (
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "")
  );
}

// ============================================================
// CRYPTO
// ============================================================

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)]
    .map(
      b => b.toString(16).padStart(2, "0")
    )
    .join("");
}

function hexToBytes(hex) {
  if (
    typeof hex !== "string" ||
    !/^[0-9a-f]+$/i.test(hex) ||
    hex.length % 2 !== 0
  ) {
    throw new Error("Invalid hexadecimal value");
  }

  const out = new Uint8Array(
    hex.length / 2
  );

  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );
  }

  return out;
}

async function sha256(value) {
  const bytes =
    new TextEncoder().encode(String(value));

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      bytes
    );

  return bytesToHex(hash);
}

async function hmacSha256(secret, value) {
  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(value)
    );

  return bytesToHex(signature);
}

async function pbkdf2Password(
  password,
  saltHex,
  iterations = PBKDF2_ITERATIONS
) {
  const baseKey =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

  const bits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: hexToBytes(saltHex),
        iterations,
        hash: "SHA-256"
      },
      baseKey,
      256
    );

  return bytesToHex(bits);
}

function randomSalt() {
  return bytesToHex(
    crypto.getRandomValues(
      new Uint8Array(16)
    )
  );
}

async function hashPassword(password, env) {
  const salt = randomSalt();

  const pepper =
    String(env.AUTH_PEPPER || "");

  const derived =
    await pbkdf2Password(
      `${pepper}:${password}`,
      salt,
      PBKDF2_ITERATIONS
    );

  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derived}`;
}

async function verifyPassword(
  password,
  storedHash,
  env
) {
  if (!storedHash) return false;

  // Legacy SHA-256 support
  if (
    !storedHash.startsWith("pbkdf2$")
  ) {
    const legacy =
      await sha256(
        `${env.AUTH_PEPPER || ""}:${password}`
      );

    return legacy === storedHash;
  }

  const parts =
    storedHash.split("$");

  if (parts.length !== 4) {
    return false;
  }

  const iterations =
    Number(parts[1]);

  if (
    !Number.isInteger(iterations) ||
    iterations < 100000 ||
    iterations > 1000000
  ) {
    return false;
  }

  try {
    const derived =
      await pbkdf2Password(
        `${env.AUTH_PEPPER || ""}:${password}`,
        parts[2],
        iterations
      );

    return derived === parts[3];
  } catch {
    return false;
  }
}

// ============================================================
// BODY
// ============================================================

async function readBody(
  request,
  maxBytes = MAX_JSON_BODY
) {
  const contentLength =
    request.headers.get("Content-Length");

  if (
    contentLength &&
    Number(contentLength) > maxBytes
  ) {
    throw new Error("Request body too large");
  }

  const text =
    await request.text();

  if (
    new TextEncoder().encode(text).byteLength >
    maxBytes
  ) {
    throw new Error("Request body too large");
  }

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

// ============================================================
// AUTH
// ============================================================

function getToken(request) {
  const auth =
    request.headers.get("Authorization") || "";

  if (!auth.startsWith("Bearer ")) {
    return null;
  }

  const token =
    auth.slice(7).trim();

  return token || null;
}

async function createSession(
  userId,
  role,
  env
) {
  const token = makeToken();

  const tokenHash =
    await hmacSha256(
      env.SESSION_SECRET ||
      env.Session_secret ||
      "change-this-session-secret",
      token
    );

  const expiresAt =
    nowSeconds() +
    SESSION_DAYS * 86400;

  await env.DB.prepare(`
    INSERT INTO sessions (
      user_id,
      token_hash,
      role,
      expires_at,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
  `)
    .bind(
      userId,
      tokenHash,
      role,
      expiresAt,
      nowSeconds()
    )
    .run();

  return token;
}

async function currentUser(
  request,
  env
) {
  const token =
    getToken(request);

  if (!token || !env.DB) {
    return null;
  }

  const secrets = [
    env.SESSION_SECRET,
    env.Session_secret,
    "change-this-session-secret"
  ].filter(Boolean);

  for (const secret of secrets) {
    const tokenHash =
      await hmacSha256(
        secret,
        token
      );

    const user =
      await env.DB.prepare(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.country,
          u.district,
          u.avatar_url,
          u.bio,
          u.is_verified,
          u.is_active,
          u.created_at,
          u.updated_at
        FROM sessions s
        JOIN users u
          ON u.id = s.user_id
        WHERE s.token_hash = ?
          AND s.expires_at > ?
          AND u.is_active = 1
        LIMIT 1
      `)
        .bind(
          tokenHash,
          nowSeconds()
        )
        .first();

    if (user) {
      return user;
    }
  }

  return null;
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "buyer",
    country: user.country || "",
    district: user.district || "",
    avatar_url: user.avatar_url || "",
    bio: user.bio || "",
    is_verified:
      Number(user.is_verified || 0),
    created_at:
      user.created_at || null
  };
}

function requireUser(
  user,
  request
) {
  if (!user) {
    return json(
      {
        success: false,
        error: "Authentication required"
      },
      401,
      request
    );
  }

  return null;
}

function requireAdmin(
  user,
  request
) {
  const error =
    requireUser(user, request);

  if (error) return error;

  if (user.role !== "admin") {
    return json(
      {
        success: false,
        error: "Admin access required"
      },
      403,
      request
    );
  }

  return null;
}

function requireSeller(
  user,
  request
) {
  const error =
    requireUser(user, request);

  if (error) return error;

  if (
    user.role !== "seller" &&
    user.role !== "admin"
  ) {
    return json(
      {
        success: false,
        error: "Seller access required"
      },
      403,
      request
    );
  }

  return null;
}

// ============================================================
// RATE LIMIT
// ============================================================

async function ensureRateLimitTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rate_key TEXT NOT NULL UNIQUE,
      count INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL
    )
  `).run();
}

async function rateLimit(
  env,
  key,
  max,
  windowSeconds
) {
  try {
    await ensureRateLimitTable(env);

    const now =
      nowSeconds();

    const row =
      await env.DB.prepare(`
        SELECT *
        FROM rate_limits
        WHERE rate_key = ?
        LIMIT 1
      `)
        .bind(key)
        .first();

    if (!row) {
      await env.DB.prepare(`
        INSERT INTO rate_limits (
          rate_key,
          count,
          window_start
        )
        VALUES (?, 1, ?)
      `)
        .bind(key, now)
        .run();

      return true;
    }

    if (
      now - Number(row.window_start) >=
      windowSeconds
    ) {
      await env.DB.prepare(`
        UPDATE rate_limits
        SET count = 1,
            window_start = ?
        WHERE rate_key = ?
      `)
        .bind(now, key)
        .run();

      return true;
    }

    if (Number(row.count) >= max) {
      return false;
    }

    await env.DB.prepare(`
      UPDATE rate_limits
      SET count = count + 1
      WHERE rate_key = ?
    `)
      .bind(key)
      .run();

    return true;
  } catch {
    return true;
  }
}

// ============================================================
// HEALTH
// ============================================================

async function health(
  env,
  request
) {
  let database = false;

  try {
    await env.DB.prepare(
      "SELECT 1"
    ).first();

    database = true;
  } catch {
    database = false;
  }

  return json(
    {
      success: true,
      app: "IsokoHub",
      domain: "isokohub.online",
      status: "online",
      database,
      storage: Boolean(env.IMAGES)
    },
    200,
    request
  );
}

// ============================================================
// CONFIG
// ============================================================

async function config(
  env,
  request
) {
  return json(
    {
      success: true,
      app: "IsokoHub",
      domain: "isokohub.online",
      marketplace: "global",
      countries: COUNTRIES.length,
      service_categories:
        SERVICE_CATEGORIES.length,
      currency: "RWF",
      commission_rate:
        COMMISSION_RATE,
      payments: {
        enabled: false,
        status: "unconfigured"
      },
      storage: {
        r2: Boolean(env.IMAGES)
      }
    },
    200,
    request
  );
}

// ============================================================
// COUNTRIES
// ============================================================

async function countries(request) {
  return json(
    {
      success: true,
      countries: COUNTRIES
    },
    200,
    request
  );
}

// ============================================================
// SERVICE CATEGORIES
// ============================================================

async function serviceCategories(
  request
) {
  return json(
    {
      success: true,
      categories:
        SERVICE_CATEGORIES
    },
    200,
    request
  );
}

// ============================================================
// CATEGORIES
// ============================================================

async function categories(
  request,
  env
) {
  const result =
    await env.DB.prepare(`
      SELECT *
      FROM categories
      WHERE is_active = 1
      ORDER BY name ASC
    `).all();

  return json(
    {
      success: true,
      categories:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// REGISTER
// ============================================================

async function register(
  request,
  env
) {
  const allowed =
    await rateLimit(
      env,
      `register:${request.headers.get("CF-Connecting-IP") || "unknown"}`,
      5,
      3600
    );

  if (!allowed) {
    return json(
      {
        success: false,
        error:
          "Too many registration attempts. Try again later."
      },
      429,
      request
    );
  }

  const data =
    await readBody(request);

  const name =
    cleanText(data.name, MAX_NAME);

  const email =
    normalizeEmail(data.email);

  const password =
    String(data.password || "");

  const phone =
    cleanText(data.phone, 50);

  const country =
    cleanText(
      data.country,
      100
    );

  const district =
    cleanText(
      data.district,
      100
    );

  if (
    !name ||
    !email ||
    !password
  ) {
    return json(
      {
        success: false,
        error:
          "Name, email and password are required"
      },
      400,
      request
    );
  }

  if (!validEmail(email)) {
    return json(
      {
        success: false,
        error: "Invalid email address"
      },
      400,
      request
    );
  }

  if (!validPassword(password)) {
    return json(
      {
        success: false,
        error:
          "Password must contain 8-200 characters"
      },
      400,
      request
    );
  }

  if (!validCountry(country)) {
    return json(
      {
        success: false,
        error: "Invalid country"
      },
      400,
      request
    );
  }

  const existing =
    await env.DB.prepare(`
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
      .bind(email)
      .first();

  if (existing) {
    return json(
      {
        success: false,
        error:
          "Email already registered"
      },
      409,
      request
    );
  }

  const passwordHash =
    await hashPassword(
      password,
      env
    );

  const result =
    await env.DB.prepare(`
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        phone,
        country,
        district,
        is_verified,
        is_active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, 'buyer', ?, ?, ?, 0, 1, ?, ?)
    `)
      .bind(
        name,
        email,
        passwordHash,
        phone,
        country,
        district,
        nowSeconds(),
        nowSeconds()
      )
      .run();

  const userId =
    result.meta?.last_row_id;

  const token =
    await createSession(
      userId,
      "buyer",
      env
    );

  const user =
    await env.DB.prepare(`
      SELECT *
      FROM users
      WHERE id = ?
      LIMIT 1
    `)
      .bind(userId)
      .first();

  return json(
    {
      success: true,
      token,
      user: publicUser(user)
    },
    201,
    request
  );
}

// ============================================================
// LOGIN
// ============================================================

async function login(
  request,
  env
) {
  const ip =
    request.headers.get(
      "CF-Connecting-IP"
    ) || "unknown";

  const data =
    await readBody(request);

  const email =
    normalizeEmail(data.email);

  const password =
    String(data.password || "");

  if (!email || !password) {
    return json(
      {
        success: false,
        error:
          "Email and password are required"
      },
      400,
      request
    );
  }

  const emailAllowed =
    await rateLimit(
      env,
      `login-email:${email}`,
      8,
      900
    );

  const ipAllowed =
    await rateLimit(
      env,
      `login-ip:${ip}`,
      20,
      900
    );

  if (
    !emailAllowed ||
    !ipAllowed
  ) {
    return json(
      {
        success: false,
        error:
          "Too many login attempts. Try again later."
      },
      429,
      request
    );
  }

  const user =
    await env.DB.prepare(`
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
      .bind(email)
      .first();

  if (!user) {
    return json(
      {
        success: false,
        error:
          "Invalid email or password"
      },
      401,
      request
    );
  }

  if (
    Number(user.is_active) !== 1
  ) {
    return json(
      {
        success: false,
        error:
          "This account is inactive"
      },
      403,
      request
    );
  }

  const valid =
    await verifyPassword(
      password,
      user.password_hash,
      env
    );

  if (!valid) {
    return json(
      {
        success: false,
        error:
          "Invalid email or password"
      },
      401,
      request
    );
  }

  // Upgrade old SHA-256 hashes
  if (
    !String(user.password_hash)
      .startsWith("pbkdf2$")
  ) {
    const upgraded =
      await hashPassword(
        password,
        env
      );

    await env.DB.prepare(`
      UPDATE users
      SET password_hash = ?,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(
        upgraded,
        nowSeconds(),
        user.id
      )
      .run();
  }

  const token =
    await createSession(
      user.id,
      user.role,
      env
    );

  return json(
    {
      success: true,
      token,
      user: publicUser(user)
    },
    200,
    request
  );
}

// ============================================================
// LOGOUT
// ============================================================

async function logout(
  request,
  env
) {
  const token =
    getToken(request);

  if (token) {
    const secrets = [
      env.SESSION_SECRET,
      env.Session_secret,
      "change-this-session-secret"
    ].filter(Boolean);

    for (const secret of secrets) {
      const tokenHash =
        await hmacSha256(
          secret,
          token
        );

      await env.DB.prepare(`
        DELETE FROM sessions
        WHERE token_hash = ?
      `)
        .bind(tokenHash)
        .run();
    }
  }

  return json(
    {
      success: true,
      message:
        "Logged out successfully"
    },
    200,
    request
  );
}

// ============================================================
// ME
// ============================================================

async function me(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  return json(
    {
      success: true,
      user: publicUser(user)
    },
    200,
    request
  );
}

// ============================================================
// PRODUCTS
// ============================================================

function serviceScore(product) {
  const text = [
    product.title,
    product.category,
    product.description,
    product.specs,
    product.condition
  ]
    .join(" ")
    .toLowerCase();

  if (
    String(product.condition)
      .toLowerCase() === "service"
  ) {
    return 10;
  }

  const keywords = [
    "service",
    "business",
    "engineering",
    "consulting",
    "construction",
    "teacher",
    "teaching",
    "course",
    "education",
    "design",
    "photography",
    "video",
    "film",
    "marketing",
    "website",
    "software",
    "development",
    "repair",
    "cleaning",
    "delivery",
    "transport",
    "freelance",
    "legal",
    "finance",
    "event",
    "tourism"
  ];

  return keywords.reduce(
    (score, keyword) =>
      score +
      (text.includes(keyword) ? 1 : 0),
    0
  );
}

async function listProducts(
  request,
  env
) {
  const url =
    new URL(request.url);

  const search =
    cleanText(
      url.searchParams.get("search"),
      200
    );

  const category =
    cleanText(
      url.searchParams.get("category"),
      200
    );

  const country =
    cleanText(
      url.searchParams.get("country"),
      100
    );

  const district =
    cleanText(
      url.searchParams.get("district"),
      100
    );

  const city =
    cleanText(
      url.searchParams.get("city"),
      100
    );

  const seller =
    url.searchParams.get("seller") || "";

  const limit =
    limitValue(
      url.searchParams.get("limit"),
      100
    );

  let sql = `
    SELECT
      p.*,
      u.name AS seller_name,
      u.phone AS seller_phone
    FROM products p
    JOIN users u
      ON u.id = p.seller_id
    WHERE p.status = 'approved'
      AND u.is_active = 1
  `;

  const params = [];

  if (search) {
    sql += `
      AND (
        p.title LIKE ?
        OR p.description LIKE ?
        OR p.brand LIKE ?
        OR p.category LIKE ?
        OR p.model LIKE ?
        OR p.specs LIKE ?
        OR p.city LIKE ?
      )
    `;

    const q = `%${search}%`;

    params.push(
      q, q, q, q, q, q, q
    );
  }

  if (category) {
    sql += `
      AND p.category = ?
    `;

    params.push(category);
  }

  if (country) {
    sql += `
      AND p.country = ?
    `;

    params.push(country);
  }

  if (district) {
    sql += `
      AND p.district = ?
    `;

    params.push(district);
  }

  if (city) {
    sql += `
      AND p.city = ?
    `;

    params.push(city);
  }

  if (seller) {
    sql += `
      AND p.seller_id = ?
    `;

    params.push(seller);
  }

  sql += `
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `;

  const result =
    await env.DB
      .prepare(sql)
      .bind(...params)
      .all();

  return json(
    {
      success: true,
      products:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// SINGLE PRODUCT
// ============================================================

async function getProduct(
  productId,
  env,
  request
) {
  const id =
    integerValue(productId, -1);

  const product =
    await env.DB.prepare(`
      SELECT
        p.*,
        u.name AS seller_name,
        u.phone AS seller_phone
      FROM products p
      JOIN users u
        ON u.id = p.seller_id
      WHERE p.id = ?
        AND p.status = 'approved'
        AND u.is_active = 1
      LIMIT 1
    `)
      .bind(id)
      .first();

  if (!product) {
    return json(
      {
        success: false,
        error:
          "Product not found"
      },
      404,
      request
    );
  }

  await env.DB.prepare(`
    UPDATE products
    SET views = COALESCE(views, 0) + 1
    WHERE id = ?
  `)
    .bind(id)
    .run();

  product.views =
    Number(product.views || 0) + 1;

  return json(
    {
      success: true,
      product
    },
    200,
    request
  );
}

// ============================================================
// CREATE PRODUCT
// ============================================================

async function createProduct(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const authError =
    requireUser(
      user,
      request
    );

  if (authError) return authError;

  const data =
    await readBody(request);

  const title =
    cleanText(
      data.title,
      MAX_TITLE
    );

  const description =
    cleanText(
      data.description,
      MAX_TEXT
    );

  const category =
    cleanText(
      data.category,
      200
    );

  const brand =
    cleanText(
      data.brand,
      150
    );

  const model =
    cleanText(
      data.model,
      150
    );

  const condition =
    cleanText(
      data.condition,
      50
    );

  const currency =
    cleanText(
      data.currency || "RWF",
      3
    ).toUpperCase();

  const country =
    cleanText(
      data.country ||
      user.country ||
      "",
      100
    );

  const district =
    cleanText(
      data.district ||
      user.district ||
      "",
      100
    );

  const city =
    cleanText(
      data.city,
      100
    );

  const price =
    numberValue(
      data.price,
      -1
    );

  const stock =
    integerValue(
      data.stock,
      1
    );

  const imageUrl =
    cleanText(
      data.image_url ||
      data.image ||
      "",
      2000
    );

  const specs =
    cleanText(
      data.specs,
      MAX_TEXT
    );

  if (!title) {
    return json(
      {
        success: false,
        error:
          "Product title is required"
      },
      400,
      request
    );
  }

  if (
    !Number.isFinite(price) ||
    price < 0 ||
    price > MAX_PRICE
  ) {
    return json(
      {
        success: false,
        error:
          "Valid product price is required"
      },
      400,
      request
    );
  }

  if (
    !Number.isInteger(stock) ||
    stock < 0 ||
    stock > MAX_STOCK
  ) {
    return json(
      {
        success: false,
        error:
          "Valid stock quantity is required"
      },
      400,
      request
    );
  }

  if (!validCurrency(currency)) {
    return json(
      {
        success: false,
        error:
          "Invalid currency"
      },
      400,
      request
    );
  }

  if (!validCountry(country)) {
    return json(
      {
        success: false,
        error:
          "Invalid country"
      },
      400,
      request
    );
  }

  if (!validURL(imageUrl)) {
    return json(
      {
        success: false,
        error:
          "Invalid image URL"
      },
      400,
      request
    );
  }

  const result =
    await env.DB.prepare(`
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
        city,
        storage,
        ram,
        image_url,
        specs,
        negotiable,
        status,
        views,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, 'pending',
        0, ?, ?
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
        city,
        cleanText(data.storage, 100),
        cleanText(data.ram, 100),
        imageUrl,
        specs,
        data.negotiable ? 1 : 0,
        nowSeconds(),
        nowSeconds()
      )
      .run();

  return json(
    {
      success: true,
      message:
        "Product submitted for review",
      product_id:
        result.meta?.last_row_id,
      status: "pending"
    },
    201,
    request
  );
}

// ============================================================
// MY PRODUCTS
// ============================================================

async function myProducts(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT *
      FROM products
      WHERE seller_id = ?
      ORDER BY created_at DESC
    `)
      .bind(user.id)
      .all();

  return json(
    {
      success: true,
      products:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// SELLER ORDERS
// ============================================================

async function sellerOrders(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireSeller(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT
        o.*,
        p.title AS product_title,
        p.image_url AS product_image,
        b.name AS buyer_name,
        b.phone AS buyer_phone
      FROM orders o
      LEFT JOIN products p
        ON p.id = o.product_id
      LEFT JOIN users b
        ON b.id = o.buyer_id
      WHERE o.seller_id = ?
      ORDER BY o.created_at DESC
    `)
      .bind(user.id)
      .all();

  return json(
    {
      success: true,
      orders:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// ORDERS
// ============================================================

async function listOrders(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT
        o.*,
        p.title AS product_title,
        p.image_url AS product_image,
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
      .bind(
        user.id,
        user.id
      )
      .all();

  return json(
    {
      success: true,
      orders:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// CREATE ORDER
// ============================================================

async function createOrder(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  const data =
    await readBody(request);

  const productId =
    integerValue(
      data.product_id,
      -1
    );

  const quantity =
    integerValue(
      data.quantity,
      1
    );

  if (productId < 1) {
    return json(
      {
        success: false,
        error:
          "Valid product_id is required"
      },
      400,
      request
    );
  }

  if (
    quantity < 1 ||
    quantity > MAX_STOCK
  ) {
    return json(
      {
        success: false,
        error:
          "Invalid quantity"
      },
      400,
      request
    );
  }

  const product =
    await env.DB.prepare(`
      SELECT *
      FROM products
      WHERE id = ?
        AND status = 'approved'
      LIMIT 1
    `)
      .bind(productId)
      .first();

  if (!product) {
    return json(
      {
        success: false,
        error:
          "Product not found"
      },
      404,
      request
    );
  }

  if (
    Number(product.seller_id) ===
    Number(user.id)
  ) {
    return json(
      {
        success: false,
        error:
          "You cannot order your own product"
      },
      400,
      request
    );
  }

  if (
    Number(product.stock) <
    quantity
  ) {
    return json(
      {
        success: false,
        error:
          "Not enough stock available"
      },
      409,
      request
    );
  }

  const unitPrice =
    Number(product.price);

  const totalPrice =
    unitPrice * quantity;

  const commission =
    totalPrice *
    COMMISSION_RATE;

  const deliveryAddress =
    cleanText(
      data.delivery_address,
      500
    );

  const deliveryCountry =
    cleanText(
      data.delivery_country ||
      user.country ||
      "",
      100
    );

  const deliveryDistrict =
    cleanText(
      data.delivery_district ||
      user.district ||
      "",
      100
    );

  const deliveryPhone =
    cleanText(
      data.delivery_phone ||
      user.phone ||
      "",
      50
    );

  // Atomic stock protection.
  const stockUpdate =
    await env.DB.prepare(`
      UPDATE products
      SET stock = stock - ?,
          updated_at = ?
      WHERE id = ?
        AND stock >= ?
        AND status = 'approved'
    `)
      .bind(
        quantity,
        nowSeconds(),
        productId,
        quantity
      )
      .run();

  if (
    !stockUpdate.meta ||
    stockUpdate.meta.changes === 0
  ) {
    return json(
      {
        success: false,
        error:
          "Product is out of stock or unavailable"
      },
      409,
      request
    );
  }

  try {
    const result =
      await env.DB.prepare(`
        INSERT INTO orders (
          buyer_id,
          product_id,
          seller_id,
          quantity,
          unit_price,
          total_price,
          commission,
          currency,
          status,
          payment_status,
          delivery_address,
          delivery_country,
          delivery_district,
          delivery_phone,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, 'pending',
          'unpaid', ?, ?, ?, ?, ?, ?
        )
      `)
        .bind(
          user.id,
          product.id,
          product.seller_id,
          quantity,
          unitPrice,
          totalPrice,
          commission,
          product.currency || "RWF",
          deliveryAddress,
          deliveryCountry,
          deliveryDistrict,
          deliveryPhone,
          nowSeconds(),
          nowSeconds()
        )
        .run();

    return json(
      {
        success: true,
        order: {
          id:
            result.meta?.last_row_id,
          product_id:
            product.id,
          quantity,
          unit_price:
            unitPrice,
          total_price:
            totalPrice,
          commission,
          currency:
            product.currency || "RWF",
          status: "pending",
          payment_status:
            "unpaid"
        }
      },
      201,
      request
    );
  } catch (error) {
    // Restore stock if order creation fails.
    await env.DB.prepare(`
      UPDATE products
      SET stock = stock + ?,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(
        quantity,
        nowSeconds(),
        productId
      )
      .run();

    throw error;
  }
}

// ============================================================
// SAVED
// ============================================================

async function listSaved(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT
        p.*,
        u.name AS seller_name
      FROM saved sp
      JOIN products p
        ON p.id = sp.product_id
      JOIN users u
        ON u.id = p.seller_id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC
    `)
      .bind(user.id)
      .all();

  return json(
    {
      success: true,
      saved:
        result.results || []
    },
    200,
    request
  );
}

async function saveProduct(
  request,
  env,
  productId
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  const id =
    integerValue(
      productId,
      -1
    );

  const product =
    await env.DB.prepare(`
      SELECT id
      FROM products
      WHERE id = ?
        AND status = 'approved'
      LIMIT 1
    `)
      .bind(id)
      .first();

  if (!product) {
    return json(
      {
        success: false,
        error:
          "Product not found"
      },
      404,
      request
    );
  }

  await env.DB.prepare(`
    INSERT OR IGNORE INTO saved (
      user_id,
      product_id,
      created_at
    )
    VALUES (?, ?, ?)
  `)
    .bind(
      user.id,
      id,
      nowSeconds()
    )
    .run();

  return json(
    {
      success: true,
      saved: true
    },
    201,
    request
  );
}

async function unsaveProduct(
  request,
  env,
  productId
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  const id =
    integerValue(
      productId,
      -1
    );

  await env.DB.prepare(`
    DELETE FROM saved
    WHERE user_id = ?
      AND product_id = ?
  `)
    .bind(
      user.id,
      id
    )
    .run();

  return json(
    {
      success: true,
      saved: false
    },
    200,
    request
  );
}

// ============================================================
// MESSAGES
// ============================================================

async function listMessages(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  const url =
    new URL(request.url);

  const withUser =
    url.searchParams.get("with") || "";

  let result;

  if (withUser) {
    const otherId =
      integerValue(
        withUser,
        -1
      );

    result =
      await env.DB.prepare(`
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
          otherId,
          otherId,
          user.id
        )
        .all();

    await env.DB.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE receiver_id = ?
        AND sender_id = ?
    `)
      .bind(
        user.id,
        otherId
      )
      .run();
  } else {
    result =
      await env.DB.prepare(`
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
        .bind(
          user.id,
          user.id
        )
        .all();
  }

  return json(
    {
      success: true,
      messages:
        result.results || []
    },
    200,
    request
  );
}

async function sendMessage(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  const data =
    await readBody(request);

  const receiverId =
    integerValue(
      data.receiver_id,
      -1
    );

  const message =
    cleanText(
      data.message ||
      data.body,
      5000
    );

  if (
    receiverId < 1 ||
    !message
  ) {
    return json(
      {
        success: false,
        error:
          "receiver_id and message are required"
      },
      400,
      request
    );
  }

  if (
    Number(receiverId) ===
    Number(user.id)
  ) {
    return json(
      {
        success: false,
        error:
          "You cannot message yourself"
      },
      400,
      request
    );
  }

  const receiver =
    await env.DB.prepare(`
      SELECT id
      FROM users
      WHERE id = ?
        AND is_active = 1
      LIMIT 1
    `)
      .bind(receiverId)
      .first();

  if (!receiver) {
    return json(
      {
        success: false,
        error:
          "Receiver not found"
      },
      404,
      request
    );
  }

  const result =
    await env.DB.prepare(`
      INSERT INTO messages (
        sender_id,
        receiver_id,
        body,
        product_id,
        is_read,
        created_at
      )
      VALUES (?, ?, ?, ?, 0, ?)
    `)
      .bind(
        user.id,
        receiverId,
        message,
        data.product_id
          ? integerValue(data.product_id, null)
          : null,
        nowSeconds()
      )
      .run();

  return json(
    {
      success: true,
      message: {
        id:
          result.meta?.last_row_id,
        sender_id:
          user.id,
        receiver_id:
          receiverId,
        body: message
      }
    },
    201,
    request
  );
}

// ============================================================
// ADMIN PRODUCTS
// ============================================================

async function adminProducts(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

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
    `)
      .all();

  return json(
    {
      success: true,
      products:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// ADMIN PRODUCT STATUS
// ============================================================

async function updateProductStatus(
  request,
  env,
  productId
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const id =
    integerValue(
      productId,
      -1
    );

  const data =
    await readBody(request);

  const status =
    cleanText(
      data.status,
      30
    );

  const allowed = [
    "pending",
    "approved",
    "rejected",
    "sold"
  ];

  if (!allowed.includes(status)) {
    return json(
      {
        success: false,
        error:
          "Invalid product status"
      },
      400,
      request
    );
  }

  const result =
    await env.DB.prepare(`
      UPDATE products
      SET status = ?,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(
        status,
        nowSeconds(),
        id
      )
      .run();

  if (
    !result.meta ||
    result.meta.changes === 0
  ) {
    return json(
      {
        success: false,
        error:
          "Product not found"
      },
      404,
      request
    );
  }

  return json(
    {
      success: true,
      message:
        "Product status updated",
      status
    },
    200,
    request
  );
}

// ============================================================
// ADMIN ORDER LIST
// ============================================================

async function adminOrders(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT
        o.*,
        p.title AS product_title,
        b.name AS buyer_name,
        s.name AS seller_name
      FROM orders o
      LEFT JOIN products p
        ON p.id = o.product_id
      LEFT JOIN users b
        ON b.id = o.buyer_id
      LEFT JOIN users s
        ON s.id = o.seller_id
      ORDER BY o.created_at DESC
      LIMIT 500
    `)
      .all();

  return json(
    {
      success: true,
      orders:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// ADMIN ORDER UPDATE
// ============================================================

async function adminUpdateOrder(
  request,
  env,
  orderId
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const id =
    integerValue(
      orderId,
      -1
    );

  const data =
    await readBody(request);

  const existing =
    await env.DB.prepare(`
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `)
      .bind(id)
      .first();

  if (!existing) {
    return json(
      {
        success: false,
        error:
          "Order not found"
      },
      404,
      request
    );
  }

  const newStatus =
    data.status !== undefined
      ? cleanText(data.status, 30)
      : existing.status;

  const newPaymentStatus =
    data.payment_status !== undefined
      ? cleanText(
          data.payment_status,
          30
        )
      : existing.payment_status;

  const allowedStatuses = [
    "pending",
    "processing",
    "confirmed",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
    "refunded"
  ];

  const allowedPaymentStatuses = [
    "unpaid",
    "pending",
    "paid",
    "failed",
    "refunded"
  ];

  if (
    !allowedStatuses.includes(
      newStatus
    )
  ) {
    return json(
      {
        success: false,
        error:
          "Invalid order status"
      },
      400,
      request
    );
  }

  if (
    !allowedPaymentStatuses.includes(
      newPaymentStatus
    )
  ) {
    return json(
      {
        success: false,
        error:
          "Invalid payment status"
      },
      400,
      request
    );
  }

  const oldClosed =
    existing.status === "cancelled" ||
    existing.status === "refunded" ||
    existing.payment_status === "refunded";

  const newClosed =
    newStatus === "cancelled" ||
    newStatus === "refunded" ||
    newPaymentStatus === "refunded";

  // Restore stock once when order becomes cancelled/refunded.
  if (
    !oldClosed &&
    newClosed
  ) {
    await env.DB.prepare(`
      UPDATE products
      SET stock = stock + ?,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(
        Number(existing.quantity),
        nowSeconds(),
        existing.product_id
      )
      .run();
  }

  // If a cancelled/refunded order becomes active again,
  // take stock back.
  if (
    oldClosed &&
    !newClosed
  ) {
    const restored =
      await env.DB.prepare(`
        UPDATE products
        SET stock = stock - ?,
            updated_at = ?
        WHERE id = ?
          AND stock >= ?
      `)
        .bind(
          Number(existing.quantity),
          nowSeconds(),
          existing.product_id,
          Number(existing.quantity)
        )
        .run();

    if (
      !restored.meta ||
      restored.meta.changes === 0
    ) {
      return json(
        {
          success: false,
          error:
            "Not enough stock to reactivate this order"
        },
        409,
        request
      );
    }
  }

  await env.DB.prepare(`
    UPDATE orders
    SET status = ?,
        payment_status = ?,
        updated_at = ?
    WHERE id = ?
  `)
    .bind(
      newStatus,
      newPaymentStatus,
      nowSeconds(),
      id
    )
    .run();

  return json(
    {
      success: true,
      message:
        "Order updated",
      status:
        newStatus,
      payment_status:
        newPaymentStatus
    },
    200,
    request
  );
}

// ============================================================
// ADMIN USERS
// ============================================================

async function adminUsers(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT
        id,
        name,
        email,
        phone,
        role,
        country,
        district,
        avatar_url,
        bio,
        is_verified,
        is_active,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 500
    `)
      .all();

  return json(
    {
      success: true,
      users:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// ADMIN STATS
// ============================================================

async function adminStats(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const users =
    await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM users
    `).first();

  const sellers =
    await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'seller'
    `).first();

  const products =
    await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM products
    `).first();

  const orders =
    await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM orders
    `).first();

  const paid =
    await env.DB.prepare(`
      SELECT
        COALESCE(
          SUM(total_price),
          0
        ) AS revenue,
        COALESCE(
          SUM(commission),
          0
        ) AS commission
      FROM orders
      WHERE payment_status = 'paid'
    `).first();

  return json(
    {
      success: true,
      stats: {
        users:
          Number(users?.count || 0),
        sellers:
          Number(sellers?.count || 0),
        products:
          Number(products?.count || 0),
        orders:
          Number(orders?.count || 0),
        revenue:
          Number(paid?.revenue || 0),
        commission:
          Number(paid?.commission || 0)
      }
    },
    200,
    request
  );
}

// ============================================================
// SELLER STATS
// ============================================================

async function sellerStats(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireSeller(
      user,
      request
    );

  if (error) return error;

  const products =
    await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM products
      WHERE seller_id = ?
    `)
      .bind(user.id)
      .first();

  const orders =
    await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE seller_id = ?
    `)
      .bind(user.id)
      .first();

  const revenue =
    await env.DB.prepare(`
      SELECT
        COALESCE(
          SUM(total_price),
          0
        ) AS revenue,
        COALESCE(
          SUM(commission),
          0
        ) AS commission
      FROM orders
      WHERE seller_id = ?
        AND payment_status = 'paid'
    `)
      .bind(user.id)
      .first();

  return json(
    {
      success: true,
      stats: {
        products:
          Number(products?.count || 0),
        orders:
          Number(orders?.count || 0),
        revenue:
          Number(revenue?.revenue || 0),
        commission:
          Number(revenue?.commission || 0),
        net_revenue:
          Number(revenue?.revenue || 0) -
          Number(revenue?.commission || 0)
      }
    },
    200,
    request
  );
}

// ============================================================
// ADMIN CATEGORIES
// ============================================================

async function adminCategories(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT *
      FROM categories
      ORDER BY name ASC
    `)
      .all();

  return json(
    {
      success: true,
      categories:
        result.results || []
    },
    200,
    request
  );
}

async function createCategory(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const data =
    await readBody(request);

  const name =
    cleanText(
      data.name,
      200
    );

  const description =
    cleanText(
      data.description,
      1000
    );

  const icon =
    cleanText(
      data.icon,
      100
    );

  if (!name) {
    return json(
      {
        success: false,
        error:
          "Category name is required"
      },
      400,
      request
    );
  }

  try {
    const result =
      await env.DB.prepare(`
        INSERT INTO categories (
          name,
          description,
          icon,
          is_active,
          created_at
        )
        VALUES (?, ?, ?, 1, ?)
      `)
        .bind(
          name,
          description,
          icon,
          nowSeconds()
        )
        .run();

    return json(
      {
        success: true,
        category_id:
          result.meta?.last_row_id,
        name
      },
      201,
      request
    );
  } catch {
    return json(
      {
        success: false,
        error:
          "Category already exists or could not be created"
      },
      409,
      request
    );
  }
}

// ============================================================
// SERVICES
// ============================================================

async function listServices(
  request,
  env
) {
  const url =
    new URL(request.url);

  const search =
    cleanText(
      url.searchParams.get("search"),
      200
    );

  const category =
    cleanText(
      url.searchParams.get("category"),
      200
    );

  const country =
    cleanText(
      url.searchParams.get("country"),
      100
    );

  const district =
    cleanText(
      url.searchParams.get("district"),
      100
    );

  let sql = `
    SELECT
      p.*,
      u.name AS seller_name,
      u.phone AS seller_phone
    FROM products p
    JOIN users u
      ON u.id = p.seller_id
    WHERE p.status = 'approved'
      AND u.is_active = 1
  `;

  const params = [];

  if (category) {
    sql += `
      AND p.category = ?
    `;

    params.push(category);
  }

  if (country) {
    sql += `
      AND p.country = ?
    `;

    params.push(country);
  }

  if (district) {
    sql += `
      AND p.district = ?
    `;

    params.push(district);
  }

  if (search) {
    sql += `
      AND (
        p.title LIKE ?
        OR p.description LIKE ?
        OR p.category LIKE ?
        OR p.specs LIKE ?
      )
    `;

    const q =
      `%${search}%`;

    params.push(
      q, q, q, q
    );
  }

  sql += `
    ORDER BY p.created_at DESC
    LIMIT 500
  `;

  const result =
    await env.DB
      .prepare(sql)
      .bind(...params)
      .all();

  const services =
    (result.results || [])
      .filter(
        product =>
          serviceScore(product) > 0
      );

  return json(
    {
      success: true,
      services
    },
    200,
    request
  );
}

// ============================================================
// ADMIN SERVICES
// ============================================================

async function adminServices(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT
        p.*,
        u.name AS seller_name,
        u.email AS seller_email
      FROM products p
      LEFT JOIN users u
        ON u.id = p.seller_id
      WHERE p.status = 'approved'
      ORDER BY p.created_at DESC
      LIMIT 500
    `)
      .all();

  const services =
    (result.results || [])
      .filter(
        product =>
          serviceScore(product) > 0
      );

  return json(
    {
      success: true,
      services
    },
    200,
    request
  );
}

// ============================================================
// R2 IMAGE UPLOAD
// ============================================================

async function uploadImage(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireUser(
      user,
      request
    );

  if (error) return error;

  if (!env.IMAGES) {
    return json(
      {
        success: false,
        error:
          "R2 image storage is not configured"
      },
      503,
      request
    );
  }

  const contentType =
    request.headers.get(
      "content-type"
    ) || "";

  if (
    !contentType.includes(
      "multipart/form-data"
    )
  ) {
    return json(
      {
        success: false,
        error:
          "multipart/form-data is required"
      },
      400,
      request
    );
  }

  const form =
    await request.formData();

  const file =
    form.get("file");

  if (
    !file ||
    typeof file.arrayBuffer !==
      "function"
  ) {
    return json(
      {
        success: false,
        error:
          "Image file is required"
      },
      400,
      request
    );
  }

  const maxImageSize =
    10 * 1024 * 1024;

  if (
    Number(file.size || 0) >
    maxImageSize
  ) {
    return json(
      {
        success: false,
        error:
          "Image must be 10MB or smaller"
      },
      413,
      request
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ];

  if (
    file.type &&
    !allowedTypes.includes(
      file.type
    )
  ) {
    return json(
      {
        success: false,
        error:
          "Unsupported image type"
      },
      400,
      request
    );
  }

  let extension = "jpg";

  if (file.type === "image/png") {
    extension = "png";
  }

  if (file.type === "image/webp") {
    extension = "webp";
  }

  if (file.type === "image/gif") {
    extension = "gif";
  }

  const key =
    `users/${user.id}/${crypto.randomUUID()}.${extension}`;

  await env.IMAGES.put(
    key,
    await file.arrayBuffer(),
    {
      httpMetadata: {
        contentType:
          file.type ||
          "image/jpeg"
      }
    }
  );

  return json(
    {
      success: true,
      key,
      url:
        `/api/images/${encodeURIComponent(key)}`
    },
    201,
    request
  );
}

// ============================================================
// R2 IMAGE GET
// ============================================================

async function getImage(
  env,
  key,
  request
) {
  if (!env.IMAGES) {
    return new Response(
      "R2 not configured",
      {
        status: 503,
        headers:
          securityHeaders(request)
      }
    );
  }

  const object =
    await env.IMAGES.get(key);

  if (!object) {
    return new Response(
      "Image not found",
      {
        status: 404,
        headers:
          securityHeaders(request)
      }
    );
  }

  const headers =
    securityHeaders(request);

  object.writeHttpMetadata(
    headers
  );

  headers.set(
    "ETag",
    object.httpEtag
  );

  headers.set(
    "Cache-Control",
    "public, max-age=31536000, immutable"
  );

  return new Response(
    object.body,
    {
      status: 200,
      headers
    }
  );
}

// ============================================================
// ADMIN PAYMENT VIEW
// ============================================================

async function adminPayments(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT
        o.id,
        o.buyer_id,
        o.seller_id,
        o.product_id,
        o.quantity,
        o.unit_price,
        o.total_price,
        o.commission,
        o.currency,
        o.payment_status,
        o.status,
        o.created_at,
        o.updated_at,
        b.name AS buyer_name,
        s.name AS seller_name,
        p.title AS product_title
      FROM orders o
      LEFT JOIN users b
        ON b.id = o.buyer_id
      LEFT JOIN users s
        ON s.id = o.seller_id
      LEFT JOIN products p
        ON p.id = o.product_id
      ORDER BY o.created_at DESC
      LIMIT 500
    `)
      .all();

  return json(
    {
      success: true,
      payments:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// ADMIN REPORTS
// ============================================================

async function adminReports(
  request,
  env
) {
  const user =
    await currentUser(
      request,
      env
    );

  const error =
    requireAdmin(
      user,
      request
    );

  if (error) return error;

  const result =
    await env.DB.prepare(`
      SELECT
        status,
        payment_status,
        COUNT(*) AS count,
        COALESCE(
          SUM(total_price),
          0
        ) AS total
      FROM orders
      GROUP BY status, payment_status
      ORDER BY count DESC
    `)
      .all();

  return json(
    {
      success: true,
      reports:
        result.results || []
    },
    200,
    request
  );
}

// ============================================================
// MAIN ROUTER
// ============================================================

export default {
  async fetch(
    request,
    env,
    ctx
  ) {
    return handleRequest(
      request,
      env,
      ctx
    );
  }
};

export async function onRequest(
  context
) {
  return handleRequest(
    context.request,
    context.env,
    context
  );
}

async function handleRequest(
  request,
  env,
  ctx
) {
  if (
    request.method === "OPTIONS"
  ) {
    return new Response(
      null,
      {
        status: 204,
        headers:
          securityHeaders(request)
      }
    );
  }

  const url =
    new URL(request.url);

  const path =
    url.pathname.replace(
      /\/+$/,
      ""
    ) || "/";

  const method =
    request.method.toUpperCase();

  try {
    if (!env.DB) {
      return json(
        {
          success: false,
          error:
            "D1 binding DB is not configured"
        },
        500,
        request
      );
    }

    // -------------------------
    // HEALTH / CONFIG
    // -------------------------

    if (
      path === "/api/health" &&
      method === "GET"
    ) {
      return health(
        env,
        request
      );
    }

    if (
      path === "/api/config" &&
      method === "GET"
    ) {
      return config(
        env,
        request
      );
    }

    if (
      path === "/api/countries" &&
      method === "GET"
    ) {
      return countries(
        request
      );
    }

    if (
      path === "/api/service-categories" &&
      method === "GET"
    ) {
      return serviceCategories(
        request
      );
    }

    if (
      path === "/api/categories" &&
      method === "GET"
    ) {
      return categories(
        request,
        env
      );
    }

    // -------------------------
    // AUTH
    // -------------------------

    if (
      (
        path === "/api/register" ||
        path === "/api/auth/register"
      ) &&
      method === "POST"
    ) {
      return register(
        request,
        env
      );
    }

    if (
      (
        path === "/api/login" ||
        path === "/api/auth/login"
      ) &&
      method === "POST"
    ) {
      return login(
        request,
        env
      );
    }

    if (
      (
        path === "/api/logout" ||
        path === "/api/auth/logout"
      ) &&
      method === "POST"
    ) {
      return logout(
        request,
        env
      );
    }

    if (
      (
        path === "/api/me" ||
        path === "/api/auth/me"
      ) &&
      method === "GET"
    ) {
      return me(
        request,
        env
      );
    }

    // -------------------------
    // PRODUCTS
    // -------------------------

    if (
      path === "/api/products" &&
      method === "GET"
    ) {
      return listProducts(
        request,
        env
      );
    }

    if (
      path === "/api/products" &&
      method === "POST"
    ) {
      return createProduct(
        request,
        env
      );
    }

    if (
      path === "/api/my-products" &&
      method === "GET"
    ) {
      return myProducts(
        request,
        env
      );
    }

    // -------------------------
    // SERVICES
    // -------------------------

    if (
      path === "/api/services" &&
      method === "GET"
    ) {
      return listServices(
        request,
        env
      );
    }

    // -------------------------
    // SAVED
    // -------------------------

    if (
      path === "/api/saved" &&
      method === "GET"
    ) {
      return listSaved(
        request,
        env
      );
    }

    // -------------------------
    // ORDERS
    // -------------------------

    if (
      path === "/api/orders" &&
      method === "GET"
    ) {
      return listOrders(
        request,
        env
      );
    }

    if (
      path === "/api/orders" &&
      method === "POST"
    ) {
      return createOrder(
        request,
        env
      );
    }

    if (
      path === "/api/seller/orders" &&
      method === "GET"
    ) {
      return sellerOrders(
        request,
        env
      );
    }

    // -------------------------
    // MESSAGES
    // -------------------------

    if (
      path === "/api/messages" &&
      method === "GET"
    ) {
      return listMessages(
        request,
        env
      );
    }

    if (
      path === "/api/messages" &&
      method === "POST"
    ) {
      return sendMessage(
        request,
        env
      );
    }

    // -------------------------
    // SELLER STATS
    // -------------------------

    if (
      path === "/api/seller/stats" &&
      method === "GET"
    ) {
      return sellerStats(
        request,
        env
      );
    }

    // -------------------------
    // IMAGE UPLOAD
    // -------------------------

    if (
      path === "/api/images" &&
      method === "POST"
    ) {
      return uploadImage(
        request,
        env
      );
    }

    // -------------------------
    // ADMIN
    // -------------------------

    if (
      path === "/api/admin/stats" &&
      method === "GET"
    ) {
      return adminStats(
        request,
        env
      );
    }

    if (
      path === "/api/admin/users" &&
      method === "GET"
    ) {
      return adminUsers(
        request,
        env
      );
    }

    if (
      path === "/api/admin/products" &&
      method === "GET"
    ) {
      return adminProducts(
        request,
        env
      );
    }

    if (
      path === "/api/admin/orders" &&
      method === "GET"
    ) {
      return adminOrders(
        request,
        env
      );
    }

    if (
      path === "/api/admin/payments" &&
      method === "GET"
    ) {
      return adminPayments(
        request,
        env
      );
    }

    if (
      path === "/api/admin/reports" &&
      method === "GET"
    ) {
      return adminReports(
        request,
        env
      );
    }

    if (
      path === "/api/admin/services" &&
      method === "GET"
    ) {
      return adminServices(
        request,
        env
      );
    }

    if (
      path === "/api/admin/categories" &&
      method === "GET"
    ) {
      return adminCategories(
        request,
        env
      );
    }

    if (
      path === "/api/admin/categories" &&
      method === "POST"
    ) {
      return createCategory(
        request,
        env
      );
    }

    // -------------------------
    // PRODUCT ID ROUTES
    // -------------------------

    const productMatch =
      path.match(
        /^\/api\/products\/([0-9]+)$/
      );

    if (
      productMatch &&
      method === "GET"
    ) {
      return getProduct(
        productMatch[1],
        env,
        request
      );
    }

    // -------------------------
    // SAVED PRODUCT ID
    // -------------------------

    const savedMatch =
      path.match(
        /^\/api\/saved\/([0-9]+)$/
      );

    if (
      savedMatch &&
      method === "POST"
    ) {
      return saveProduct(
        request,
        env,
        savedMatch[1]
      );
    }

    if (
      savedMatch &&
      method === "DELETE"
    ) {
      return unsaveProduct(
        request,
        env,
        savedMatch[1]
      );
    }

    // -------------------------
    // ADMIN PRODUCT STATUS
    // -------------------------

    const statusMatch =
      path.match(
        /^\/api\/admin\/products\/([0-9]+)\/status$/
      );

    if (
      statusMatch &&
      method === "PATCH"
    ) {
      return updateProductStatus(
        request,
        env,
        statusMatch[1]
      );
    }

    // -------------------------
    // ADMIN ORDER UPDATE
    // -------------------------

    const orderMatch =
      path.match(
        /^\/api\/admin\/orders\/([0-9]+)$/
      );

    if (
      orderMatch &&
      method === "PATCH"
    ) {
      return adminUpdateOrder(
        request,
        env,
        orderMatch[1]
      );
    }

    // -------------------------
    // R2 IMAGE GET
    // -------------------------

    const imageMatch =
      path.match(
        /^\/api\/images\/(.+)$/
      );

    if (
      imageMatch &&
      method === "GET"
    ) {
      return getImage(
        env,
        decodeURIComponent(
          imageMatch[1]
        ),
        request
      );
    }

    // -------------------------
    // UNKNOWN ROUTE
    // -------------------------

    return json(
      {
        success: false,
        error:
          "API route not found",
        path
      },
      404,
      request
    );

  } catch (error) {
    console.error(
      "IsokoHub API error:",
      error
    );

    const message =
      error?.message || "";

    if (
      message ===
      "Request body too large"
    ) {
      return json(
        {
          success: false,
          error:
            "Request body too large"
        },
        413,
        request
      );
    }

    if (
      message ===
      "Invalid JSON body"
    ) {
      return json(
        {
          success: false,
          error:
            "Invalid JSON body"
        },
        400,
        request
      );
    }

    return json(
      {
        success: false,
        error:
          "Internal server error"
      },
      500,
      request
    );
  }
}
