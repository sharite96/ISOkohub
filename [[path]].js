export async function onRequest(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const path = url.pathname;

  // Health check
  if (path === "/api/health") {
    return Response.json({
      success: true,
      message: "IsokoHub API is working",
      service: "IsokoHub",
      timestamp: new Date().toISOString()
    });
  }

  // API information
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

  // Products
  if (path === "/api/products") {
    return Response.json({
      success: true,
      products: [],
      message: "Products endpoint is ready"
    });
  }

  // Sellers
  if (path === "/api/sellers") {
    return Response.json({
      success: true,
      sellers: [],
      message: "Sellers endpoint is ready"
    });
  }

  // Categories
  if (path === "/api/categories") {
    return Response.json({
      success: true,
      categories: [
        "Electronics",
        "Fashion",
        "Home",
        "Education",
        "Art & Creative",
        "Film & Entertainment",
        "Services"
      ]
    });
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: "API route not found",
      path
    }),
    {
      status: 404,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
  }
