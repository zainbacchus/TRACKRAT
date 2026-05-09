export const config = { runtime: 'edge' };

export default function handler() {
  const ZONE = 'America/Chicago';
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: ZONE }));

  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSunday);
  next.setHours(8, 30, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 7);
  }

  const display = next.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: ZONE
  }).toUpperCase();

  const pad = n => String(n).padStart(2, '0');
  const iso = `${next.getFullYear()}-${pad(next.getMonth()+1)}-${pad(next.getDate())}T08:30:00-05:00`;

  return Response.json({
    display,
    iso,
    time: '8:30AM',
    location: '4401 TILLEY'
  });
}
