export const config = { runtime: 'edge' };

const ZONE = 'America/Chicago';

const EVENTS = [
  {
    type: 'sunday',
    title: 'SUNDAY SPRINTS',
    weekday: 0,            // 0 = Sunday
    hour: 8,
    minute: 30,
    time: '8:30AM',
    location: '4401 TILLEY'
  },
  {
    type: 'thursday',
    title: 'MIDWEEK WORKOUT',
    weekday: 4,            // 4 = Thursday
    hour: 18,
    minute: 30,
    time: '6:30PM',
    location: 'TBD VIA IG'
  }
];

function nextOccurrence(now, weekday, hour, minute) {
  const next = new Date(now);
  const daysUntil = (weekday - now.getDay() + 7) % 7;
  next.setDate(now.getDate() + daysUntil);
  next.setHours(hour, minute, 0, 0);
  // If the target time today has already passed, push to next week
  if (next <= now) {
    next.setDate(next.getDate() + 7);
  }
  return next;
}

// Returns "-05:00" during CDT, "-06:00" during CST
function chicagoOffset(date) {
  const tzName = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE,
    timeZoneName: 'short'
  }).formatToParts(date).find(p => p.type === 'timeZoneName').value;
  return tzName === 'CDT' ? '-05:00' : '-06:00';
}

export default function handler() {
  // Same timezone-shifting pattern as the original: build a Date whose
  // local-time getters (getDay, getHours, etc.) return Chicago wall-clock values.
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: ZONE }));

  // Compute next occurrence of each event, sort by soonest, take the winner.
  const upcoming = EVENTS
    .map(ev => ({ ...ev, next: nextOccurrence(now, ev.weekday, ev.hour, ev.minute) }))
    .sort((a, b) => a.next - b.next);

  const event = upcoming[0];
  const next = event.next;

  const display = next.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: ZONE
  }).toUpperCase();

  const weekday = next.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: ZONE
  }).toUpperCase();

  const pad = n => String(n).padStart(2, '0');
  const offset = chicagoOffset(new Date());
  const iso = `${next.getFullYear()}-${pad(next.getMonth()+1)}-${pad(next.getDate())}T${pad(event.hour)}:${pad(event.minute)}:00${offset}`;

  return Response.json({
    display,
    weekday,
    iso,
    time: event.time,
    location: event.location,
    type: event.type,
    title: event.title
  });
}
