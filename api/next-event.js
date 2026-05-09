export const config = { runtime: 'edge' };

export default function handler() {
  const ZONE = 'America/Chicago';
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: ZONE }));

  // Find next Sunday at 8:30 AM CT
  const day = now.getDay(); // 0 = Sunday
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSunday);
  next.setHours(8, 30, 0, 0);

  // If that target is already past, add another week
  if (next <= now) {
    next.setDate(next.getDate() + 7);
  }

  // Format: "MAY 10" — matching Luxon's "MMM d".toUpperCase()
  const display = next.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: ZONE
  }).toUpperCase(); // e.g. "May 10" → "MAY 10"

  return Response.json({
    display,                              // "MAY 10"
    iso: next.toISOString(),              // full ISO for countdown target
    time: '8:30AM',
    location: '4401 TILLEY'
  });
}
