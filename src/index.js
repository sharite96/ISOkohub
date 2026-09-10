export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    try {
      // Health check
      if (path === "/api/health" && request.method === "GET") {
        return json({
          ok: true,
          service: "IsokoHub API",
          database: !!env.DB,
          time: new Date().toISOString()
        });
      }

      // Configuration
      if (path === "/api/config" && request.method === "GET") {
        return json({
          ok: true,
          app: "IsokoHub",
          database: !!env.DB,
          payments: false,
          images: !!env.IMAGES
        });
      }

      // Categories
      if (path === "/api/categories" && request.method === "GET") {
        const categories = [
          {
            id: "electronics",
            name: "Electronics",
            icon: "📱"
          },
          {
            id: "fashion",
            name: "Fashion",
            icon: "👕"
          },
          {
            id: "home",
            name: "Home",
            icon: "🏠"
          },
          {
            id: "education",
            name: "Education",
            icon: "📚"
          },
          {
            id: "art",
            name: "Art & Creative",
            icon: "🎨"
          },
          {
            id: "film",
            name: "Film & Entertainment",
            icon: "🎬"
          },
          {
            id: "services",
            name: "Services",
            icon: "🛠️"
          }
        ];

        return json({
          ok: true,
          categories
        });
      }

      // Products
      if (path === "/api/products" && request.method === "GET") {
        if (!env.DB) {
          return json({
            ok: false,
            error: "D1 database binding DB is not connected"
          }, 500);
        }

        const result = await env.DB.prepare(`
          SELECT *
          FROM products
          ORDER BY id DESC
          LIMIT 100
        `).all();

        return json({
          ok: true,
          products: result.results || []
        });
      }

      // Single product
      if (
        path.startsWith("/api/products/") &&
        request.method === "GET"
      ) {
        if (!env.DB) {
          return json({
            ok: false,
            error: "D1 database binding DB is not connected"
          }, 500);
        }

        const id = path.split("/").pop();

        const product = await env.DB.prepare(`
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
          }, 404);
        }

        return json({
          ok: true,
          product
        });
      }

      // API not found
      if (path.startsWith("/api/")) {
        return json({
          ok: false,
          error: "API endpoint not found",
          path
        }, 404);
      }

      // Static frontend
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response("IsokoHub is running.", {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=UTF-8"
        }
      });

    } catch (error) {
      return json({
        ok: false,
        error: error.message || "Internal server error"
      }, 500);
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "content-type": "application/json; charset=UTF-8",
        ...corsHeaders()
      }
    }
  );
}
