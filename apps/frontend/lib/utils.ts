import { format, addDays, parseISO } from 'date-fns';

const EVENT_START_DATE = process.env.NEXT_PUBLIC_EVENT_START_DATE ?? '2026-07-01';
const EVENT_DAYS = parseInt(process.env.NEXT_PUBLIC_EVENT_DAYS ?? '7');

export function getEventDays(): { day: number; date: string; label: string }[] {
  return Array.from({ length: EVENT_DAYS }, (_, i) => {
    const date = addDays(parseISO(EVENT_START_DATE), i);
    return {
      day: i + 1,
      date: format(date, 'yyyy-MM-dd'),
      label: `Day ${i + 1} — ${format(date, 'EEEE, MMM d')}`,
    };
  });
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'EEEE, MMMM d, yyyy');
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
