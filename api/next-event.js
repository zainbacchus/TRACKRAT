export const config = { runtime: 'edge' };

export default function handler() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSunday);

  return Response.json({
    date: next.toISOString().split('T')[0],      // e.g. "2026-05-10"
    display: next.toLocaleDateString('en-US', {   // e.g. "MAY 10"
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Chicago'
    }).toUpperCase(),
    time: '8:30AM',
    location: '4401 TILLEY'
  });
}
