const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store"
};

const COMMISSION_RATE = 0.05;
const PBKDF2_ITERATIONS = 150000;
const MAX_JSON_BODY = 1024 * 1024;

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
  "Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia",
  "Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti",
  "Honduras","Hungary","Iceland","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
  "Lithuania","Luxembourg","Madagascar","Malawi","Malaysia",
  "Maldives","Mali","Malta","Marshall Islands","Mauritania",
  "Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia",
  "Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan",
  "Palau","Palestine","Panama","Papua New Guinea","Paraguay",
  "Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia",
  "Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syria","Tajikistan","Tanzania","Thailand",
  "Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
  "Türkiye","Turkmenistan","Tuvalu","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela",
  "Vietnam","Yemen","Zambia","Zimbabwe"
];

/* =========================================================
   SERVICE CATEGORY ALIASES
========================================================= */

const SERVICE_ALIASES = {
  "it & technology": [
    "it & technology",
    "technology & it",
    "technology",
    "software",
    "information technology"
  ],
  "construction & property": [
    "construction & property",
    "construction & home services",
    "construction",
    "property",
    "real estate"
  ],
  "education & teachers": [
    "education & teachers",
    "education",
    "teachers",
    "teaching"
  ],
  "art & creative": [
    "art & creative",
    "art",
    "creative",
    "design"
  ],
  "film & entertainment": [
    "film & entertainment",
    "film",
    "entertainment"
  ],
  "marketing & communication": [
    "marketing & communication",
    "marketing & advertising",
    "marketing",
    "advertising",
    "communication"
  ],
  "automotive & transport": [
    "automotive & transport",
    "automotive",
    "transport"
  ],
  "food & hospitality": [
    "food & hospitality",
    "food & catering",
    "food",
    "catering",
    "hospitality"
  ],
  "jobs & freelance": [
    "jobs & freelance",
    "jobs",
    "job",
    "freelance",
    "freelancer"
  ],
  "business & professional": [
    "business & professional",
    "business services",
    "professional services"
  ],
  "home services": [
    "home services",
    "home repair"
  ]
};

const SERVICE_MAP = {
  "Business & Professional":
    ["business","consultant","consulting","management","professional"],

  "Engineering":
    ["engineer","engineering"],

  "IT & Technology":
    ["software","developer","development","website","app",
     "technology","programming","computer","it support"],

  "Construction & Property":
    ["construction","builder","building","architect",
     "property","real estate"],

  "Education & Teachers":
    ["teacher","teaching","tutor","education",
     "course","training","lesson"],

  "Art & Creative":
    ["artist","art","design","designer","graphic",
     "creative","photography","photographer"],

  "Film & Entertainment":
    ["film","filmmaker","producer","videography",
     "video","actor","entertainment"],

  "Marketing & Communication":
    ["marketing","branding","advertising","social media",
     "communication","copywriter"],

  "Automotive & Transport":
    ["automotive","mechanic","driver","transport","vehicle"],

  "Agriculture & Environment":
    ["agriculture","farming","farmer","environment","gardening"],

  "Home Services":
    ["plumber","plumbing","electrician","cleaning",
     "cleaner","home repair","installation"],

  "Legal & Finance":
    ["lawyer","legal","accountant","accounting",
     "finance","tax","audit"],

  "Health & Wellness":
    ["doctor","health","therapy","fitness","wellness"],

  "Beauty & Personal Care":
    ["beauty","salon","barber","hair","makeup"],

  "Food & Hospitality":
    ["restaurant","hotel","chef","catering","food","hospitality"],

  "Events":
    ["event","events","wedding","party"],

  "Logistics":
    ["logistics","delivery","shipping","warehouse","courier"],

  "Travel & Tourism":
    ["travel","tourism","tour","hotel"],

  "Industrial & Manufacturing":
    ["factory","machine","manufacturing","industrial"],

  "Jobs & Freelance":
    ["job","jobs","freelance","freelancer"],

  "Services":
    ["service","services"],

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
      ...SECURITY_HEADERS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

async function readJSON(request) {
  const contentLength = Number(
    request.headers.get("Content-Length") || 0
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_JSON_BODY
  ) {
    throw new Error("REQUEST_TOO_LARGE");
  }

  try {
    return await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }
}

async function sha256(value) {
  const data = new TextEncoder().encode(String(value));
  const hash = await crypto.subtle.digest("SHA-256", data);

  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* =========================================================
   HMAC SECURITY
========================================================= */

async function hmacSha256(secret, value) {
  if (!secret) {
    throw new Error("SERVER_SECURITY_CONFIG");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(secret)),
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
    new TextEncoder().encode(String(value))
  );

  return [...new Uint8Array(signature)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* =========================================================
   CONSTANT-TIME COMPARISON
========================================================= */

function safeEqual(a, b) {
  a = String(a ?? "");
  b = String(b ?? "");

  if (a.length !== b.length) return false;

  let difference = 0;

  for (let i = 0; i < a.length; i++) {
    difference |=
      a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return difference === 0;
}

/* =========================================================
   BYTE / HEX HELPERS
========================================================= */

function bytesToHex(bytes) {
  return [...bytes]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  if (
    typeof hex !== "string" ||
    hex.length % 2 !== 0 ||
    !/^[0-9a-f]+$/i.test(hex)
  ) {
    throw new Error("INVALID_HASH_FORMAT");
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );
  }

  return bytes;
}

/* =========================================================
   PASSWORD SECURITY
========================================================= */

async function derivePasswordBits(
  password,
  saltBytes,
  iterations = PBKDF2_ITERATIONS
) {
  const passwordKey =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(String(password)),
      {
        name: "PBKDF2"
      },
      false,
      ["deriveBits"]
    );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256"
    },
    passwordKey,
    256
  );
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);

  crypto.getRandomValues(salt);

  const bits = await derivePasswordBits(
    password,
    salt,
    PBKDF2_ITERATIONS
  );

  const hash =
    new Uint8Array(bits);

  return [
    "pbkdf2",
    PBKDF2_ITERATIONS,
    bytesToHex(salt),
    bytesToHex(hash)
  ].join("$");
}

async function verifyPassword(password, storedHash) {
  const stored =
    String(storedHash || "");

  /* New secure PBKDF2 format */
  if (stored.startsWith("pbkdf2$")) {
    const parts = stored.split("$");

    if (parts.length !== 4) {
      return {
        ok: false,
        legacy: false
      };
    }

    const iterations =
      Number(parts[1]);

    const saltHex = parts[2];
    const expectedHash = parts[3];

    if (
      !Number.isInteger(iterations) ||
      iterations < 100000 ||
      iterations > 1000000 ||
      !saltHex ||
      !expectedHash
    ) {
      return {
        ok: false,
        legacy: false
      };
    }

    try {
      const salt =
        hexToBytes(saltHex);

      const bits =
        await derivePasswordBits(
          password,
          salt,
          iterations
        );

      const actualHash =
        bytesToHex(new Uint8Array(bits));

      return {
        ok: safeEqual(
          actualHash,
          expectedHash
        ),
        legacy: false
      };
    } catch {
      return {
        ok: false,
        legacy: false
      };
    }
  }

  /* Legacy SHA-256 password support.
     Successful login upgrades it to PBKDF2. */
  if (
    /^[0-9a-f]{64}$/i.test(stored)
  ) {
    const legacyHash =
      await sha256(password);

    return {
      ok: safeEqual(
        legacyHash,
        stored
      ),
      legacy: true
    };
  }

  return {
    ok: false,
    legacy: false
  };
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n)
    ? n
    : fallback;
}

function limitValue(
  value,
  fallback = 100,
  max = 500
) {
  const n = Math.floor(Number(value));

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return fallback;
  }

  return Math.min(n, max);
}

function tokenFromRequest(request) {
  const h =
    request.headers.get("Authorization") || "";

  if (!h.startsWith("Bearer ")) {
    return null;
  }

  const token =
    h.slice(7).trim();

  if (!token || token.length > 500) {
    return null;
  }

  return token;
}

function requireDB(env) {
  if (!env?.DB) {
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

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || "")
  );
}

function cleanText(value, max = 5000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

/* =========================================================
   PRODUCT / SERVICE DETECTION
========================================================= */

function isServiceProduct(product) {
  const category =
    normalize(product.category);

  const title =
    normalize(product.title);

  const PRODUCT_CATEGORIES = [
    "electronics",
    "fashion",
    "home",
    "phones",
    "laptops",
    "computers",
    "clothing",
    "shoes",
    "furniture",
    "appliances",
    "accessories",
    "handmade products"
  ];

  if (
    PRODUCT_CATEGORIES.includes(category)
  ) {
    return false;
  }

  if (
    SERVICE_CATEGORIES.some(
      c => normalize(c) === category
    )
  ) {
    return true;
  }

  for (
    const aliases of Object.values(SERVICE_ALIASES)
  ) {
    if (
      aliases.some(
        x => normalize(x) === category
      )
    ) {
      return true;
    }
  }

  const strongWords = [
    "service",
    "services",
    "consultant",
    "consulting",
    "engineer",
    "engineering",
    "developer",
    "development",
    "designer",
    "design service",
    "teacher",
    "tutor",
    "course",
    "training",
    "photography service",
    "photographer",
    "videography",
    "filmmaker",
    "film production",
    "producer",
    "digital marketing",
    "marketing service",
    "lawyer",
    "legal service",
    "accountant",
    "accounting service",
    "doctor",
    "health service",
    "therapy",
    "fitness training",
    "beauty service",
    "salon",
    "barber",
    "catering",
    "event service",
    "event photography",
    "transport service",
    "driver service",
    "delivery service",
    "logistics service",
    "travel service",
    "construction service",
    "plumbing service",
    "electrician",
    "cleaning service",
    "mechanic service",
    "repair service",
    "branding service",
    "social media service",
    "tax service",
    "chef service",
    "shipping service",
    "warehouse service",
    "courier service",
    "manufacturing service",
    "freelance",
    "freelancer"
  ];

  const titleCategory =
    `${title} ${category}`;

  return strongWords.some(
    word =>
      titleCategory.includes(
        normalize(word)
      )
  );
}

function serviceCategoryMatch(
  product,
  category
) {
  if (!category) return true;

  const wanted =
    normalize(category);

  const actual =
    normalize(product.category);

  if (actual === wanted) {
    return true;
  }

  for (
    const aliases of Object.values(SERVICE_ALIASES)
  ) {
    if (
      aliases.some(
        x => normalize(x) === wanted
      ) &&
      aliases.some(
        x => normalize(x) === actual
      )
    ) {
      return true;
    }
  }

  const official =
    SERVICE_CATEGORIES.find(
      x => normalize(x) === wanted
    );

  const words =
    SERVICE_MAP[official] ||
    SERVICE_MAP[category] ||
    [];

  const text =
    productText(product);

  return words.some(
    word =>
      text.includes(
        normalize(word)
      )
  );
}

/* =========================================================
   SESSION SECURITY
========================================================= */

async function createSession(
  db,
  userId,
  role,
  env
) {
  const sessionSecret =
    String(env?.Session_secret || "");

  if (!sessionSecret) {
    throw new Error(
      "SERVER_SECURITY_CONFIG"
    );
  }

  const normalizedRole =
    normalize(role);

  let secret =
    sessionSecret;

  if (normalizedRole === "admin") {
    const adminSecret =
      String(env?.Admin_secret || "");

    if (!adminSecret) {
      throw new Error(
        "SERVER_SECURITY_CONFIG"
      );
    }

    secret =
      `${sessionSecret}:${adminSecret}`;
  }

  const token =
    `${crypto.randomUUID()}-${crypto.randomUUID()}`;

  const hash =
    await hmacSha256(
      secret,
      token
    );

  await db.prepare(`
    INSERT INTO sessions
      (user_id, token_hash, expires_at)
    VALUES
      (?, ?, datetime('now', '+30 days'))
  `).bind(
    userId,
    hash
  ).run();

  return token;
}

async function sessionHashes(
  env,
  token
) {
  const hashes = [];

  const sessionSecret =
    String(env?.Session_secret || "");

  const adminSecret =
    String(env?.Admin_secret || "");

  if (sessionSecret) {
    hashes.push(
      await hmacSha256(
        sessionSecret,
        token
      )
    );
  }

  if (
    sessionSecret &&
    adminSecret
  ) {
    hashes.push(
      await hmacSha256(
        `${sessionSecret}:${adminSecret}`,
        token
      )
    );
  }

  /* Legacy sessions remain usable
     until they expire. */
  hashes.push(
    await sha256(token)
  );

  return [
    ...new Set(hashes)
  ];
}

async function authenticate(
  env,
  request
) {
  const db =
    requireDB(env);

  const token =
    tokenFromRequest(request);

  if (!token) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const hashes =
    await sessionHashes(
      env,
      token
    );

  const placeholders =
    hashes.map(() => "?").join(",");

  const user =
    await db.prepare(`
      SELECT
        s.token_hash AS session_token_hash,
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
      WHERE s.token_hash IN (${placeholders})
        AND s.expires_at > datetime('now')
        AND u.is_active = 1
      LIMIT 1
    `).bind(
      ...hashes
    ).first();

  if (!user) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  return user;
}

async function requireUser(
  env,
  request
) {
  return authenticate(
    env,
    request
  );
}

async function requireAdmin(
  env,
  request
) {
  const user =
    await authenticate(
      env,
      request
    );

  if (
    normalize(user.role) !== "admin"
  ) {
    throw new Error(
      "ADMIN_ONLY"
    );
  }

  const token =
    tokenFromRequest(request);

  if (!token) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  /* New admin sessions must be
     protected by both secrets. */
  if (
    env?.Session_secret &&
    env?.Admin_secret
  ) {
    const adminHash =
      await hmacSha256(
        `${env.Session_secret}:${env.Admin_secret}`,
        token
      );

    const legacyHash =
      await sha256(token);

    const validAdminSession =
      safeEqual(
        user.session_token_hash,
        adminHash
      ) ||
      safeEqual(
        user.session_token_hash,
        legacyHash
      );

    if (!validAdminSession) {
      throw new Error(
        "ADMIN_SESSION_REQUIRED"
      );
    }
  }

  return user;
}

/* =========================================================
   WORKER
========================================================= */

export default {
  async fetch(request, env) {
    const url =
      new URL(request.url);

    const path =
      url.pathname;

    const method =
      request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...CORS,
          ...SECURITY_HEADERS
        }
      });
    }

    const productMatch =
      path.match(
        /^\/api\/products\/(\d+)$/
      );

    try {
      /* =====================================================
         HEALTH
      ===================================================== */

      if (
        path === "/api/health" &&
        method === "GET"
      ) {
        let database =
          "not_connected";

        let ok = false;

        try {
          requireDB(env);

          await env.DB
            .prepare("SELECT 1")
            .first();

          database =
            "connected";

          ok = true;
        } catch (e) {
          console.error(
            "Health DB error:",
            e
          );

          database =
            "error";
        }

        return json({
          ok,
          service:
            "IsokoHub API",
          database,
          time:
            new Date().toISOString()
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
          environment:
            "production",
          platform:
            "cloudflare-workers",
          database: "D1",
          assets: "ASSETS",
          marketplace:
            "global",
          countries:
            COUNTRIES.length,
          service_categories:
            SERVICE_CATEGORIES.length,
          commission_rate:
            COMMISSION_RATE
        });
      }

      const db =
        requireDB(env);

      /* =====================================================
         COUNTRIES
      ===================================================== */

      if (
        path === "/api/countries" &&
        method === "GET"
      ) {
        const q =
          normalize(
            url.searchParams.get(
              "search"
            )
          );

        const countries =
          q
            ? COUNTRIES.filter(
                x =>
                  normalize(x)
                    .includes(q)
              )
            : COUNTRIES;

        return json({
          ok: true,
          countries,
          count:
            countries.length
        });
      }

      /* =====================================================
         SERVICE CATEGORIES
      ===================================================== */

      if (
        path ===
          "/api/service-categories" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          categories:
            SERVICE_CATEGORIES,
          count:
            SERVICE_CATEGORIES.length
        });
      }

      /* =====================================================
         CATEGORIES
      ===================================================== */

      if (
        path === "/api/categories" &&
        method === "GET"
      ) {
        const rows =
          await db.prepare(`
            SELECT *
            FROM categories
            WHERE is_active = 1
            ORDER BY name ASC
          `).all();

        return json({
          ok: true,
          categories:
            rows.results || []
        });
      }

      /* =====================================================
         PRODUCTS
      ===================================================== */

      if (
        path === "/api/products" &&
        method === "GET"
      ) {
        const search =
          cleanText(
            url.searchParams.get(
              "search"
            ) || "",
            100
          );

        const category =
          cleanText(
            url.searchParams.get(
              "category"
            ) || "",
            100
          );

        const country =
          cleanText(
            url.searchParams.get(
              "country"
            ) || "",
            100
          );

        const limit =
          limitValue(
            url.searchParams.get(
              "limit"
            ),
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
          const s =
            `%${search}%`;

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

          binds.push(
            s,s,s,s,s,s,s,s
          );
        }

        if (category) {
          sql +=
            ` AND p.category LIKE ? `;

          binds.push(
            `%${category}%`
          );
        }

        if (country) {
          sql +=
            ` AND p.country LIKE ? `;

          binds.push(
            `%${country}%`
          );
        }

        sql +=
          ` ORDER BY p.id DESC LIMIT ? `;

        binds.push(limit);

        const rows =
          await db.prepare(sql)
            .bind(...binds)
            .all();

        return json({
          ok: true,
          products:
            rows.results || [],
          count:
            (rows.results || [])
              .length
        });
      }

      /* =====================================================
         SINGLE PRODUCT
      ===================================================== */

      if (
        productMatch &&
        method === "GET"
      ) {
        const id =
          Number(productMatch[1]);

        const product =
          await db.prepare(`
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
          `).bind(id).first();

        if (!product) {
          return json({
            error:
              "Product not found"
          }, 404);
        }

        try {
          await db.prepare(`
            UPDATE products
            SET views =
              COALESCE(views, 0) + 1
            WHERE id = ?
          `).bind(id).run();
        } catch {}

        return json({
          ok: true,
          product
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
          cleanText(
            url.searchParams.get(
              "search"
            ) ||
            url.searchParams.get(
              "q"
            ) ||
            "",
            100
          );

        const category =
          cleanText(
            url.searchParams.get(
              "category"
            ) || "",
            100
          );

        const country =
          cleanText(
            url.searchParams.get(
              "country"
            ) || "",
            100
          );

        const city =
          cleanText(
            url.searchParams.get(
              "city"
            ) ||
            url.searchParams.get(
              "district"
            ) ||
            "",
            100
          );

        const provider =
          cleanText(
            url.searchParams.get(
              "provider"
            ) || "",
            100
          );

        const online =
          normalize(
            url.searchParams.get(
              "online"
            )
          );

        const limit =
          limitValue(
            url.searchParams.get(
              "limit"
            ),
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
            .filter(
              isServiceProduct
            );

        if (search) {
          const q =
            normalize(search);

          const searchIsCategory =
            SERVICE_CATEGORIES.some(
              c =>
                normalize(c) === q
            ) ||
            Object.values(
              SERVICE_ALIASES
            ).some(
              aliases =>
                aliases.some(
                  a =>
                    normalize(a) === q
                )
            );

          services =
            searchIsCategory
              ? services.filter(
                  p =>
                    serviceCategoryMatch(
                      p,
                      search
                    )
                )
              : services.filter(
                  p =>
                    productText(p)
                      .includes(q)
                );
        }

        if (category) {
          services =
            services.filter(
              p =>
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
            services.filter(
              p =>
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
            services.filter(
              p =>
                normalize(
                  p.district
                ).includes(q)
            );
        }

        if (provider) {
          const q =
            normalize(provider);

          services =
            services.filter(
              p =>
                normalize(
                  p.seller_name
                ).includes(q)
            );
        }

        if (
          online === "true" ||
          online === "1"
        ) {
          services =
            services.filter(p => {
              const text =
                productText(p);

              return (
                text.includes(
                  "online"
                ) ||
                text.includes(
                  "remote"
                ) ||
                text.includes(
                  "virtual"
                )
              );
            });
        }

        services =
          services.slice(0, limit);

        return json({
          ok: true,
          services,
          count:
            services.length,
          global: true,
          countries:
            COUNTRIES.length
        });
      }

      /* =====================================================
         REGISTER
      ===================================================== */

      if (
        path === "/api/register" &&
        method === "POST"
      ) {
        const body =
          await readJSON(request);

        const name =
          cleanText(
            body.name,
            120
          );

        const email =
          normalize(body.email);

        const password =
          String(
            body.password || ""
          );

        const country =
          cleanText(
            body.country ||
              "Rwanda",
            100
          );

        if (!name) {
          return json({
            error:
              "Full name is required"
          }, 400);
        }

        if (name.length < 2) {
          return json({
            error:
              "Name is too short"
          }, 400);
        }

        if (!email) {
          return json({
            error:
              "Email is required"
          }, 400);
        }

        if (
          email.length > 254 ||
          !validEmail(email)
        ) {
          return json({
            error:
              "Please enter a valid email"
          }, 400);
        }

        if (password.length < 8) {
          return json({
            error:
              "Password must contain at least 8 characters"
          }, 400);
        }

        if (password.length > 128) {
          return json({
            error:
              "Password is too long"
          }, 400);
        }

        if (
          !COUNTRIES.includes(country)
        ) {
          return json({
            error:
              "Invalid country"
          }, 400);
        }

        const existing =
          await db.prepare(`
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
          `).bind(email).first();

        if (existing) {
          return json({
            error:
              "An account with this email already exists"
          }, 409);
        }

        const passwordHash =
          await hashPassword(
            password
          );

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
              (
                ?, ?, ?, ?,
                'buyer',
                1,
                0
              )
          `).bind(
            name,
            email,
            passwordHash,
            country
          ).run();

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
          `).bind(
            result.meta?.last_row_id
          ).first();

        if (!user) {
          throw new Error(
            "REGISTRATION_FAILED"
          );
        }

        const token =
          await createSession(
            db,
            user.id,
            user.role,
            env
          ); 

        return json({
          ok: true,
          token,
          user:
            safeUser(user)
        }, 201);
      }

      /* =====================================================
         LOGIN
      ===================================================== */

      if (
        path === "/api/login" &&
        method === "POST"
      ) {
        const body =
          await readJSON(request);

        const email =
          normalize(body.email);

        const password =
          String(
            body.password || ""
          );

        if (
          !email ||
          !password
        ) {
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
          `).bind(email).first();

        if (!user) {
          return json({
            error:
              "Invalid email or password"
          }, 401);
        }

        const verification =
          await verifyPassword(
            password,
            user.password_hash
          );

        if (!verification.ok) {
          return json({
            error:
              "Invalid email or password"
          }, 401);
        }

        /* Upgrade old SHA-256 passwords */
        if (verification.legacy) {
          try {
            const upgraded =
              await hashPassword(
                password
              );

            await db.prepare(`
              UPDATE users
              SET password_hash = ?
              WHERE id = ?
            `).bind(
              upgraded,
              user.id
            ).run();
          } catch (e) {
            console.error(
              "Password upgrade error:",
              e
            );
          }
        }

        const token =
          await createSession(
            db,
            user.id,
            user.role,
            env
          );

        return json({
          ok: true,
          token,
          user:
            safeUser(user)
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
          user:
            safeUser(user)
        });
      }

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
            ? cleanText(
                body.name,
                120
              )
            : user.name;

        const country =
          body.country !== undefined
            ? cleanText(
                body.country,
                100
              )
            : user.country;

        if (
          name.length < 2
        ) {
          return json({
            error:
              "Name is too short"
          }, 400);
        }

        if (
          country &&
          !COUNTRIES.includes(
            country
          )
        ) {
          return json({
            error:
              "Invalid country"
          }, 400);
        }

        await db.prepare(`
          UPDATE users
          SET
            name = ?,
            country = ?
          WHERE id = ?
        `).bind(
          name,
          country,
          user.id
        ).run();

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
          `).bind(
            user.id
          ).first();

        return json({
          ok: true,
          user:
            safeUser(updated)
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
          const hashes =
            await sessionHashes(
              env,
              token
            );

          const placeholders =
            hashes
              .map(() => "?")
              .join(",");

          await db.prepare(`
            DELETE FROM sessions
            WHERE token_hash IN (${placeholders})
          `).bind(
            ...hashes
          ).run();
        }

        return json({
          ok: true,
          message:
            "Logged out"
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
          cleanText(
            body.title,
            200
          );

        const category =
          cleanText(
            body.category,
            150
          );

        const description =
          cleanText(
            body.description,
            10000
          );

        const specs =
          cleanText(
            body.specs,
            10000
          );

        const price =
          number(body.price);

        const currency =
          cleanText(
            body.currency ||
              "RWF",
            10
          );

        const stock =
          Math.max(
            0,
            Math.floor(
              number(
                body.stock,
                1
              )
            )
          );

        const condition =
          cleanText(
            body.condition ||
              "new",
            30
          );

        const country =
          cleanText(
            body.country ||
              user.country ||
              "Rwanda",
            100
          );

        const district =
          cleanText(
            body.district,
            100
          );

        const brand =
          cleanText(
            body.brand,
            100
          );

        const model =
          cleanText(
            body.model,
            100
          );

        const storage =
          cleanText(
            body.storage,
            100
          );

        const ram =
          cleanText(
            body.ram,
            100
          );

        const image_url =
          cleanText(
            body.image_url ||
              body.imageUrl ||
              "",
            2000
          );

        const negotiable =
          body.negotiable
            ? 1
            : 0;

        if (!title) {
          return json({
            error:
              "Title is required"
          }, 400);
        }

        if (!category) {
          return json({
            error:
              "Category is required"
          }, 400);
        }

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          return json({
            error:
              "Invalid price"
          }, 400);
        }

        const validConditions = [
          "new",
          "used",
          "has crack",
          "refurbished"
        ];

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

        if (
          !COUNTRIES.includes(country)
        ) {
          return json({
            error:
              "Invalid country"
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
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, 'active'
            )
          `).bind(
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
          ).run();

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
          Number(
            productMatch[1]
          );

        const existing =
          await db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
            LIMIT 1
          `).bind(id).first();

        if (!existing) {
          return json({
            error:
              "Product not found"
          }, 404);
        }

        if (
          Number(
            existing.seller_id
          ) !== Number(user.id) &&
          normalize(user.role) !==
            "admin"
        ) {
          return json({
            error:
              "Not allowed"
          }, 403);
        }

        const b =
          await readJSON(request);

        const value =
          (key, fallback) =>
            b[key] !== undefined
              ? b[key]
              : fallback;

        const title =
          cleanText(
            value(
              "title",
              existing.title
            ),
            200
          );

        const category =
          cleanText(
            value(
              "category",
              existing.category
            ),
            150
          );

        const description =
          cleanText(
            value(
              "description",
              existing.description
            ),
            10000
          );

        const price =
          number(
            value(
              "price",
              existing.price
            )
          );

        const stock =
          Math.max(
            0,
            Math.floor(
              number(
                value(
                  "stock",
                  existing.stock
                )
              )
            )
          );

        const condition =
          cleanText(
            value(
              "condition",
              existing.condition
            ),
            30
          );

        if (
          !title ||
          !category
        ) {
          return json({
            error:
              "Title and category are required"
          }, 400);
        }

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          return json({
            error:
              "Invalid price"
          }, 400);
        }

        const validConditions = [
          "new",
          "used",
          "has crack",
          "refurbished"
        ];

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
        `).bind(
          title,
          category,
          description,
          price,
          cleanText(
            value(
              "currency",
              existing.currency
            ),
            10
          ),
          stock,
          cleanText(
            value(
              "brand",
              existing.brand
            ),
            100
          ),
          cleanText(
            value(
              "model",
              existing.model
            ),
            100
          ),
          condition,
          cleanText(
            value(
              "country",
              existing.country
            ),
            100
          ),
          cleanText(
            value(
              "district",
              existing.district
            ),
            100
          ),
          cleanText(
            value(
              "storage",
              existing.storage
            ),
            100
          ),
          cleanText(
            value(
              "ram",
              existing.ram
            ),
            100
          ),
          cleanText(
            value(
              "image_url",
              existing.image_url
            ),
            2000
          ),
          cleanText(
            value(
              "specs",
              existing.specs
            ),
            10000
          ),
          value(
            "negotiable",
            existing.negotiable
          ) ? 1 : 0,
          cleanText(
            value(
              "status",
              existing.status
            ),
            30
          ),
          id
        ).run();

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
          Number(
            productMatch[1]
          );

        const existing =
          await db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
          `).bind(id).first();

        if (!existing) {
          return json({
            error:
              "Product not found"
          }, 404);
        }

        if (
          Number(
            existing.seller_id
          ) !== Number(user.id) &&
          normalize(user.role) !==
            "admin"
        ) {
          return json({
            error:
              "Not allowed"
          }, 403);
        }

        await db.prepare(`
          UPDATE products
          SET status = 'inactive'
          WHERE id = ?
        `).bind(id).run();

        return json({
          ok: true,
          message:
            "Product removed successfully"
        });
      }

      /* =====================================================
         SAVED
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
              p.id AS product_id,
              p.title,
              p.category,
              p.description,
              p.price,
              p.currency,
              p.stock,
              p.condition,
              p.country,
              p.district,
              p.image_url,
              p.specs,
              p.status,
              u.name AS seller_name,
              u.country AS seller_country
            FROM saved_products sp
            JOIN products p
              ON p.id = sp.product_id
            JOIN users u
              ON u.id = p.seller_id
            WHERE sp.user_id = ?
            ORDER BY sp.id DESC
          `).bind(
            user.id
          ).all();

        return json({
          ok: true,
          saved:
            rows.results || []
        });
      }

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
          `).bind(
            productId
          ).first();

        if (!product) {
          return json({
            error:
              "Product not found"
          }, 404);
        }

        await db.prepare(`
          INSERT OR IGNORE INTO saved_products
            (user_id, product_id)
          VALUES
            (?, ?)
        `).bind(
          user.id,
          productId
        ).run();

        return json({
          ok: true,
          message:
            "Saved"
        }, 201);
      }

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

        await db.prepare(`
          DELETE FROM saved_products
          WHERE user_id = ?
            AND product_id = ?
        `).bind(
          user.id,
          Number(
            savedMatch[1]
          )
        ).run();

        return json({
          ok: true,
          message:
            "Removed from saved"
        });
      }

      /* =====================================================
         ORDERS GET
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
            WHERE o.buyer_id = ?
               OR o.seller_id = ?
            ORDER BY o.id DESC
          `).bind(
            user.id,
            user.id
          ).all();

        const orders =
          (rows.results || [])
            .map(o => ({
              ...o,
              commission:
                number(
                  o.total_price
                ) *
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
          cleanText(
            body.delivery_address ||
            body.deliveryAddress ||
            "",
            1000
          );

        const deliveryCountry =
          cleanText(
            body.delivery_country ||
            body.deliveryCountry ||
            user.country ||
            "",
            100
          );

        const deliveryDistrict =
          cleanText(
            body.delivery_district ||
            body.deliveryDistrict ||
            "",
            100
          );

        const deliveryPhone =
          cleanText(
            body.delivery_phone ||
            body.deliveryPhone ||
            "",
            50
          );

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
          `).bind(
            productId
          ).first();

        if (!product) {
          return json({
            error:
              "Product is not available"
          }, 404);
        }

        if (
          Number(
            product.seller_id
          ) === Number(user.id)
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
          cleanText(
            product.currency ||
              "RWF",
            10
          );

        const update =
          await db.prepare(`
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
              AND status = 'active'
              AND stock >= ?
          `).bind(
            quantity,
            productId,
            quantity
          ).run();

        if (
          !update.success ||
          Number(
            update.meta?.changes || 0
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
                ?, ?, ?, ?, ?,
                ?, ?,
                'pending',
                'unpaid',
                ?, ?, ?, ?
              )
            `).bind(
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
            ).run();

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
              totalPrice *
              COMMISSION_RATE,
            currency
          }, 201);

        } catch (e) {
          await db.prepare(`
            UPDATE products
            SET stock = stock + ?
            WHERE id = ?
          `).bind(
            quantity,
            productId
          ).run();

          throw e;
        }
      }

      /* =====================================================
         MESSAGES
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
            WHERE m.sender_id = ?
               OR m.receiver_id = ?
            ORDER BY m.id ASC
          `).bind(
            user.id,
            user.id
          ).all();

        return json({
          ok: true,
          messages:
            rows.results || []
        });
      }

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
          cleanText(
            body.body ||
            body.message ||
            "",
            5000
          );

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
          `).bind(
            receiverId
          ).first();

        if (!receiver) {
          return json({
            error:
              "Recipient not found"
          }, 404);
        }

        const result =
          await db.prepare(`
            INSERT INTO messages
              (sender_id, receiver_id, body)
            VALUES
              (?, ?, ?)
          `).bind(
            user.id,
            receiverId,
            message
          ).run();

        return json({
          ok: true,
          message:
            "Message sent",
          id:
            result.meta?.last_row_id
        }, 201);
      }

      /* =====================================================
         SELLER
      ===================================================== */

      if (
        path ===
          "/api/seller/products" &&
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
          `).bind(
            user.id
          ).all();

        return json({
          ok: true,
          products:
            rows.results || []
        });
      }

      if (
        path ===
          "/api/seller/stats" &&
        method === "GET"
      ) {
        const user =
          await requireUser(
            env,
            request
          );

        const products =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM products
            WHERE seller_id = ?
          `).bind(
            user.id
          ).first();

        const orders =
          await db.prepare(`
            SELECT COUNT(*) AS count
            FROM orders
            WHERE seller_id = ?
          `).bind(
            user.id
          ).first();

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
          `).bind(
            user.id
          ).first();

        const total =
          Number(
            sales?.total || 0
          );

        return json({
          ok: true,
          stats: {
            products:
              Number(
                products?.count || 0
              ),
            orders:
              Number(
                orders?.count || 0
              ),
            paid_sales:
              total,
            commission:
              total *
              COMMISSION_RATE
          }
        });
      }

      /* =====================================================
         ADMIN AUTH
      ===================================================== */

      const isAdminPath =
        path.startsWith(
          "/api/admin/"
        );

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
        path ===
          "/api/admin/stats" &&
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
            SELECT
              COUNT(
                DISTINCT country
              ) AS count
            FROM users
            WHERE country IS NOT NULL
              AND country != ''
          `).first();

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

        const serviceCount =
          (serviceRows.results || [])
            .filter(
              isServiceProduct
            )
            .length;

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
        path ===
          "/api/admin/users" &&
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
        path ===
          "/api/admin/sellers" &&
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
            ORDER BY
              product_count DESC
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
        path ===
          "/api/admin/products" &&
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
        path ===
          "/api/admin/orders" &&
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
          (rows.results || [])
            .map(o => ({
              ...o,
              commission:
                number(
                  o.total_price
                ) *
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
        path ===
          "/api/admin/payments" &&
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

        const payments =
          (rows.results || [])
            .map(o => ({
              ...o,
              commission:
                number(
                  o.total_price
                ) *
                COMMISSION_RATE
            }));

        return json({
          ok: true,
          payments,
          summary: {
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
                (s, x) =>
                  s +
                  number(
                    x.total_price
                  ),
                0
              ),

            total_commission:
              payments.reduce(
                (s, x) =>
                  s +
                  number(
                    x.total_price
                  ) *
                  COMMISSION_RATE,
                0
              )
          }
        });
      }

      /* =====================================================
         ADMIN SERVICES
      ===================================================== */

      if (
        path ===
          "/api/admin/services" &&
        method === "GET"
      ) {
        const search =
          cleanText(
            url.searchParams.get(
              "search"
            ) || "",
            100
          );

        const country =
          cleanText(
            url.searchParams.get(
              "country"
            ) || "",
            100
          );

        const category =
          cleanText(
            url.searchParams.get(
              "category"
            ) || "",
            100
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
            ORDER BY p.id DESC
            LIMIT 2000
          `).all();

        let services =
          (rows.results || [])
            .filter(
              isServiceProduct
            );

        if (search) {
          const q =
            normalize(search);

          const categorySearch =
            SERVICE_CATEGORIES.some(
              c =>
                normalize(c) === q
            ) ||
            Object.values(
              SERVICE_ALIASES
            ).some(
              a =>
                a.some(
                  x =>
                    normalize(x) === q
                )
            );

          services =
            categorySearch
              ? services.filter(
                  p =>
                    serviceCategoryMatch(
                      p,
                      search
                    )
                )
              : services.filter(
                  p =>
                    productText(p)
                      .includes(q)
                );
        }

        if (category) {
          services =
            services.filter(
              p =>
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
            services.filter(
              p =>
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
        path ===
          "/api/admin/reports" &&
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
              usersByCountry.results ||
              [],

            products_by_category:
              productsByCategory.results ||
              [],

            order_statuses:
              orderStatuses.results ||
              [],

            payment_statuses:
              paymentStatuses.results ||
              [],

            top_products:
              topProducts.results ||
              []
          }
        });
      }

      /* =====================================================
         ADMIN REVIEWS / PROMOTIONS / ADS
      ===================================================== */

      if (
        path ===
          "/api/admin/reviews" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          supported: false,
          reviews: []
        });
      }

      if (
        path ===
          "/api/admin/promotions" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          supported: false,
          promotions: []
        });
      }

      if (
        path ===
          "/api/admin/ads" &&
        method === "GET"
      ) {
        return json({
          ok: true,
          supported: false,
          ads: []
        });
      }

      /* =====================================================
         ADMIN CATEGORIES
      ===================================================== */

      if (
        path ===
          "/api/admin/categories" &&
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

      if (
        path ===
          "/api/admin/categories" &&
        method === "POST"
      ) {
        const body =
          await readJSON(request);

        const name =
          cleanText(
            body.name ||
            body.title ||
            "",
            150
          );

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
          `).bind(name).first();

        if (existing) {
          return json({
            error:
              "Category already exists"
          }, 409);
        }

        const result =
          await db.prepare(`
            INSERT INTO categories
              (name,is_active)
            VALUES
              (?,1)
          `).bind(
            name
          ).run();

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
            ? cleanText(
                body.status,
                50
              )
            : null;

        const paymentStatus =
          body.payment_status !==
          undefined
            ? cleanText(
                body.payment_status,
                50
              )
            : null;

        if (
          status === null &&
          paymentStatus === null
        ) {
          return json({
            error:
              "status or payment_status is required"
          }, 400);
        }

        const order =
          await db.prepare(`
            SELECT id
            FROM orders
            WHERE id = ?
          `).bind(id).first();

        if (!order) {
          return json({
            error:
              "Order not found"
          }, 404);
        }

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
          `).bind(
            status,
            paymentStatus,
            id
          ).run();

        } else if (
          status !== null
        ) {
          await db.prepare(`
            UPDATE orders
            SET status = ?
            WHERE id = ?
          `).bind(
            status,
            id
          ).run();

        } else {
          await db.prepare(`
            UPDATE orders
            SET payment_status = ?
            WHERE id = ?
          `).bind(
            paymentStatus,
            id
          ).run();
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
          `).bind(id).first();

        if (!target) {
          return json({
            error:
              "User not found"
          }, 404);
        }

        const role =
          body.role !== undefined
            ? normalize(
                body.role
              )
            : normalize(
                target.role
              );

        const validRoles = [
          "buyer",
          "seller",
          "admin"
        ];

        if (
          !validRoles.includes(
            role
          )
        ) {
          return json({
            error:
              "Invalid user role"
          }, 400);
        }

        const isActive =
          body.is_active !==
          undefined
            ? (
                body.is_active
                  ? 1
                  : 0
              )
            : Number(
                target.is_active
              );

        const isVerified =
          body.is_verified !==
          undefined
            ? (
                body.is_verified
                  ? 1
                  : 0
              )
            : Number(
                target.is_verified
              );

        /* Admin cannot disable own account */
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

        /* Admin cannot remove own admin role */
        if (
          Number(id) ===
            Number(admin.id) &&
          role !== "admin"
        ) {
          return json({
            error:
              "You cannot remove your own admin role"
          }, 400);
        }

        /* Never leave the system without an admin */
        if (
          role !== "admin" ||
          !isActive
        ) {
          const currentAdminCount =
            await db.prepare(`
              SELECT COUNT(*) AS count
              FROM users
              WHERE role = 'admin'
                AND is_active = 1
            `).first();

          const isCurrentlyAdmin =
            normalize(
              target.role
            ) === "admin" &&
            Number(
              target.is_active
            ) === 1;

          if (
            isCurrentlyAdmin &&
            Number(
              currentAdminCount?.count ||
              0
            ) <= 1
          ) {
            return json({
              error:
                "At least one active admin account must remain"
            }, 400);
          }
        }

        await db.prepare(`
          UPDATE users
          SET
            role = ?,
            is_active = ?,
            is_verified = ?
          WHERE id = ?
        `).bind(
          role,
          isActive,
          isVerified,
          id
        ).run();

        return json({
          ok: true,
          message:
            "User updated"
        });
      }

      /* =====================================================
         ADMIN PRODUCT UPDATE
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
          cleanText(
            body.status || "",
            50
          );

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
          `).bind(id).first();

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
        `).bind(
          status,
          id
        ).run();

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
        path ===
          "/api/service-search" &&
        method === "GET"
      ) {
        const search =
          cleanText(
            url.searchParams.get(
              "search"
            ) ||
            url.searchParams.get(
              "q"
            ) ||
            "",
            100
          );

        const category =
          cleanText(
            url.searchParams.get(
              "category"
            ) || "",
            100
          );

        const country =
          cleanText(
            url.searchParams.get(
              "country"
            ) || "",
            100
          );

        const city =
          cleanText(
            url.searchParams.get(
              "city"
            ) ||
            url.searchParams.get(
              "district"
            ) ||
            "",
            100
          );

        const provider =
          cleanText(
            url.searchParams.get(
              "provider"
            ) || "",
            100
          );

        const limit =
          limitValue(
            url.searchParams.get(
              "limit"
            ),
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
            .filter(
              isServiceProduct
            );

        if (search) {
          const q =
            normalize(search);

          const categorySearch =
            SERVICE_CATEGORIES.some(
              c =>
                normalize(c) === q
            ) ||
            Object.values(
              SERVICE_ALIASES
            ).some(
              a =>
                a.some(
                  x =>
                    normalize(x) === q
                )
            );

          services =
            categorySearch
              ? services.filter(
                  p =>
                    serviceCategoryMatch(
                      p,
                      search
                    )
                )
              : services.filter(
                  p =>
                    productText(p)
                      .includes(q)
                );
        }

        if (category) {
          services =
            services.filter(
              p =>
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
            services.filter(
              p =>
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
            services.filter(
              p =>
                normalize(
                  p.district
                ).includes(q)
            );
        }

        if (provider) {
          const q =
            normalize(provider);

          services =
            services.filter(
              p =>
                normalize(
                  p.seller_name
                ).includes(q)
            );
        }

        services =
          services.slice(
            0,
            limit
          );

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
        !path.startsWith(
          "/api/"
        )
      ) {
        const assetResponse =
          await env.ASSETS.fetch(
            request
          );

        const headers =
          new Headers(
            assetResponse.headers
          );

        headers.set(
          "X-Content-Type-Options",
          "nosniff"
        );

        headers.set(
          "Referrer-Policy",
          "strict-origin-when-cross-origin"
        );

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

      if (
        error.message ===
        "ADMIN_SESSION_REQUIRED"
      ) {
        return json({
          error:
            "Please sign in again to access the admin area"
        }, 403);
      }

      if (
        error.message ===
        "REQUEST_TOO_LARGE"
      ) {
        return json({
          error:
            "Request is too large"
        }, 413);
      }

      if (
        error.message ===
        "INVALID_JSON"
      ) {
        return json({
          error:
            "Invalid request data"
        }, 400);
      }

      if (
        error.message ===
        "SERVER_SECURITY_CONFIG"
      ) {
        return json({
          error:
            "Server security configuration is incomplete"
        }, 500);
      }

      if (
        error.message ===
        "REGISTRATION_FAILED"
      ) {
        return json({
          error:
            "Registration could not be completed"
        }, 500);
      }

      /* Never expose internal database,
         SQL, secret or stack-trace details. */
      return json({
        error:
          "Internal server error"
      }, 500);
    }
  }
};

