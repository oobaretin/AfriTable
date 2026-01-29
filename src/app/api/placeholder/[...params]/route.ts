import { NextResponse } from "next/server";

/**
 * Placeholder image API route
 * Generates a simple SVG placeholder image
 * Usage: /api/placeholder/width/height
 * Example: /api/placeholder/400/400
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ params: string[] }> }
) {
  const { params: pathParams } = await params;
  const [width = "400", height = "400"] = pathParams || [];

  const w = parseInt(width, 10) || 400;
  const h = parseInt(height, 10) || 400;

  // Validate dimensions
  if (w > 2000 || h > 2000 || w < 1 || h < 1) {
    return NextResponse.json(
      { error: "Invalid dimensions. Width and height must be between 1 and 2000." },
      { status: 400 }
    );
  }

  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${Math.min(w, h) / 10}" 
        fill="#9ca3af" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${w} × ${h}
      </text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
