/**
 * Generate placeholder image data URIs to avoid Next.js image optimization issues
 * with API routes that return SVG
 * 
 * Using data URIs prevents Vercel from trying to optimize placeholder images
 * through the _next/image endpoint, which causes INVALID_IMAGE_OPTIMIZE_REQUEST errors
 */

function getPlaceholderDataURI(width: number, height: number): string {
  // Create a simple SVG placeholder as a data URI
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" font-family="system-ui,-apple-system,sans-serif" font-size="${Math.min(width, height) / 10}" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">${width} × ${height}</text></svg>`;
  
  // Convert to base64 data URI (works in both Node.js and browser)
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } else {
    // Browser environment - use btoa
    const base64 = btoa(svg);
    return `data:image/svg+xml;base64,${base64}`;
  }
}

// Common placeholder sizes - computed at module load time
export const PLACEHOLDERS = {
  small: getPlaceholderDataURI(200, 200),
  medium: getPlaceholderDataURI(400, 400),
  large: getPlaceholderDataURI(600, 700),
  square: (size: number) => getPlaceholderDataURI(size, size),
  rect: (width: number, height: number) => getPlaceholderDataURI(width, height),
};
