export const config = {
  matcher: '/',
};

export default async function middleware(request) {
  const url = new URL(request.url);

  // Get the next event details from your API
  const event = await fetch(`${url.origin}/api/next-event`).then(r => r.json());

  // Fetch the original homepage HTML
  const res = await fetch(url.toString());
  let html = await res.text();

  // Map of tspan IDs → values to inject.
  // Each key is the id="..." attribute on a <tspan> in the SVG.
  // Add more pairs here as you add more dynamic fields to the homepage.
  const replacements = {
    'js-date-desktop':     event.display,
    'js-date-mobile':      event.display,
    'js-weekday-desktop':  event.weekday,
    'js-weekday-mobile':   event.weekday,
    'js-title-desktop':    event.title,
    'js-title-mobile':     event.title,
    'js-time-desktop':     event.time,
    'js-time-mobile':      event.time,
    'js-location-desktop': event.location,
    'js-location-mobile':  event.location,
  };

  for (const [id, value] of Object.entries(replacements)) {
    if (value == null) continue;
    const pattern = new RegExp(`(<tspan[^>]*id="${id}"[^>]*>)[^<]*`);
    html = html.replace(pattern, `$1${value}`);
  }

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
