export const config = {
  matcher: '/',
};

export default async function middleware(request) {
  const url = new URL(request.url);

  // Get live date from your API
  const { display } = await fetch(`${url.origin}/api/next-event`).then(r => r.json());

  // Fetch the original HTML
  const res = await fetch(url.toString());
  let html = await res.text();

  // Replace hardcoded date in both SVG tspans
  html = html.replace(
    /(<tspan[^>]*id="js-date-desktop"[^>]*>)[^<]*/,
    `$1${display}`
  );
  html = html.replace(
    /(<tspan[^>]*id="js-date-mobile"[^>]*>)[^<]*/,
    `$1${display}`
  );

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
