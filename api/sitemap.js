export const config = { runtime: 'edge' };

export default function handler() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://trackratsprint.club</loc></url>
  <url><loc>https://trackratsprint.club/brand</loc></url>
  <url><loc>https://shop.trackratsprint.club</loc></url>
  <url><loc>https://trackratsprint.club/llms.txt</loc></url>
</urlset>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml' },
  });
}
