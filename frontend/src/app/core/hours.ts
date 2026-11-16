import { WEEKLY_HOURS } from './brand';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function nowInKolkata(): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMin = (hhmm: string) => {
  const [h = '0', m = '0'] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
};

export function prettyTime(hhmm: string): string {
  const total = toMin(hhmm);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''} ${suffix}`;
}

/** e.g. { open: true, text: 'Open now, until 1 pm' } */
export function openStatus(): { open: boolean; text: string } {
  const { day, minutes } = nowInKolkata();
  const today = WEEKLY_HOURS[day] ?? [];
  for (const [start, end] of today) {
    if (minutes >= toMin(start) && minutes < toMin(end)) return { open: true, text: `Open now, until ${prettyTime(end)}` };
  }
  const laterToday = today.find(([start]) => toMin(start) > minutes);
  if (laterToday) return { open: false, text: `Closed now, opens at ${prettyTime(laterToday[0])}` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const first = WEEKLY_HOURS[d]?.[0];
    if (first) return { open: false, text: `Closed now, opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${prettyTime(first[0])}` };
  }
  return { open: false, text: 'Closed' };
}
