export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // ==============================
  // HEALTH CHECK
  // ==============================
  if (path === "/api/health") {
    return Response.json({
      success: true,
      message: "IsokoHub API is working",
      service: "IsokoHub",
      timestamp: new Date().toISOString()
    });
  }

  // ==============================
  // API INFORMATION
  // ==============================
  if (path === "/api") {
    return Response.json({
      success: true,
      name: "IsokoHub",
      message: "Welcome to IsokoHub API",
      endpoints: [
        "/api/health",
        "/api/products",
        "/api/sellers",
        "/api/categories"
      ]
    });
  }

  // ==============================
  // PRODUCTS
  // ==============================
  if (path === "/api/products") {

    // GET PRODUCTS
    if (request.method === "GET") {

      try {

        const search =
          url.searchParams.get("search") || "";

        const category =
          url.searchParams.get("category") || "";

        let query = `
          SELECT
            p.id,
            p.seller_id,
            p.category_id,
            p.title,
            p.slug,
            p.short_description,
            p.description,
            p.price,
            p.currency,
            p.negotiable,
            p.brand,
            p.model,
            p.condition,
            p.storage,
            p.ram,
            p.specifications,
            p.district,
            p.country,
            p.stock,
            p.status,
            p.views,
            p.created_at,

            c.name AS category_name,

            s.business_name AS seller_name

          FROM products p

          LEFT JOIN categories c
            ON p.category_id = c.id

          LEFT JOIN sellers s
            ON p.seller_id = s.id

          WHERE p.status = 'approved'
        `;

        const params = [];

        if (search) {

          query += `
            AND (
              p.title LIKE ?
              OR p.short_description LIKE ?
              OR p.description LIKE ?
              OR p.brand LIKE ?
              OR p.model LIKE ?
            )
          `;

          const term = `%${search}%`;

          params.push(
            term,
            term,
            term,
            term,
            term
          );
        }

        if (category) {

          query += `
            AND c.name = ?
          `;

          params.push(category);
        }

        query += `
          ORDER BY p.id DESC
          LIMIT 100
        `;

        const result =
          await env.DB
            .prepare(query)
            .bind(...params)
            .all();

        return Response.json({
          success: true,
          products: result.results || []
        });

      } catch (error) {

        console.error(error);

        return Response.json(
          {
            success: false,
            error: "Could not load products."
          },
          { status: 500 }
        );
      }
    }

    // POST PRODUCT
    if (request.method === "POST") {

      try {

        const body =
          await request.json();

        if (
          !body.title ||
          !body.category ||
          !body.description ||
          body.price === undefined
        ) {

          return Response.json(
            {
              success: false,
              error:
                "Title, category, description and price are required."
            },
            { status: 400 }
          );
        }

        /*
         * Temporary seller:
         * Until authentication/seller registration
         * is connected, we use the first approved seller.
         */

        const seller =
          await env.DB
            .prepare(`
              SELECT id
              FROM sellers
              WHERE status = 'approved'
              ORDER BY id ASC
              LIMIT 1
            `)
            .first();

        if (!seller) {

          return Response.json(
            {
              success: false,
              error:
                "No approved seller exists yet. Seller registration must be completed first."
            },
            { status: 400 }
          );
        }

        const category =
          await env.DB
            .prepare(`
              SELECT id
              FROM categories
              WHERE name = ?
              LIMIT 1
            `)
            .bind(body.category)
            .first();

        if (!category) {

          return Response.json(
            {
              success: false,
              error:
                "Selected category does not exist."
            },
            { status: 400 }
          );
        }

        const slug =
          createSlug(body.title) +
          "-" +
          Date.now();

        const result =
          await env.DB
            .prepare(`
              INSERT INTO products (
                seller_id,
                category_id,
                title,
                slug,
                short_description,
                description,
                price,
                currency,
                negotiable,
                brand,
                model,
                condition,
                storage,
                ram,
                specifications,
                district,
                country,
                stock,
                status
              )

              VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?
              )
            `)
            .bind(

              seller.id,

              category.id,

              body.title,

              slug,

              body.description,

              body.description,

              Number(body.price || 0),

              "RWF",

              Number(body.negotiable || 0),

              body.brand || "",

              body.model || "",

              body.condition || "new",

              body.storage || "",

              body.ram || "",

              body.specifications || "",

              body.district || "",

              "Rwanda",

              1,

              "pending"

            )
            .run();

        return Response.json({
          success: true,
          message:
            "Product submitted successfully for review.",
          product_id:
            result.meta?.last_row_id || null
        });

      } catch (error) {

        console.error(error);

        return Response.json(
          {
            success: false,
            error:
              "Could not submit product."
          },
          { status: 500 }
        );
      }
    }

    return Response.json(
      {
        success: false,
        error: "Method not allowed."
      },
      {
        status: 405,
        headers: {
          Allow: "GET, POST"
        }
      }
    );
  }

  // ==============================
  // SELLERS
  // ==============================
  if (path === "/api/sellers") {

    try {

      const result =
        await env.DB
          .prepare(`
            SELECT
              id,
              business_name,
              description,
              phone,
              email,
              district,
              country,
              logo_url,
              verified,
              status,
              created_at
            FROM sellers
            WHERE status = 'approved'
            ORDER BY id DESC
          `)
          .all();

      return Response.json({
        success: true,
        sellers: result.results || []
      });

    } catch (error) {

      console.error(error);

      return Response.json(
        {
          success: false,
          error: "Could not load sellers."
        },
        { status: 500 }
      );
    }
  }

  // ==============================
  // CATEGORIES
  // ==============================
  if (path === "/api/categories") {

    try {

      const result =
        await env.DB
          .prepare(`
            SELECT
              id,
              name,
              slug,
              description,
              image_url
            FROM categories
            ORDER BY name ASC
          `)
          .all();

      return Response.json({
        success: true,
        categories:
          result.results || []
      });

    } catch (error) {

      console.error(error);

      return Response.json(
        {
          success: false,
          error:
            "Could not load categories."
        },
        { status: 500 }
      );
    }
  }

  // ==============================
  // NOT FOUND
  // ==============================
  return Response.json(
    {
      success: false,
      error: "API route not found",
      path
    },
    {
      status: 404
    }
  );
}


// ==============================
// SLUG HELPER
// ==============================

function createSlug(text) {

  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
